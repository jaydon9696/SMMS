from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.menu import MenuItem
from app.models.order import Order, OrderItem
from app.models.table import RestaurantTable
from app.repositories.menu_repository import MenuItemRepository
from app.repositories.order_repository import OrderItemRepository as OrderItemRepo
from app.repositories.order_repository import OrderRepository, OrderStatusHistoryRepository
from app.repositories.table_repository import TableRepository
from app.schemas.order import OrderCreate, OrderUpdateStatus
from app.websocket.manager import manager


ORDER_STATUS_FLOW = ["pending", "accepted", "preparing", "ready", "completed"]


class OrderService:
    def __init__(
        self,
        order_repository: OrderRepository | None = None,
        order_item_repository: OrderItemRepo | None = None,
        menu_item_repository: MenuItemRepository | None = None,
        table_repository: TableRepository | None = None,
        history_repository: OrderStatusHistoryRepository | None = None,
    ) -> None:
        self.order_repository = order_repository or OrderRepository()
        self.order_item_repository = order_item_repository or OrderItemRepo()
        self.menu_item_repository = menu_item_repository or MenuItemRepository()
        self.table_repository = table_repository or TableRepository()
        self.history_repository = history_repository or OrderStatusHistoryRepository()

    def _get_table(self, db: Session, table_id: UUID) -> RestaurantTable:
        table = self.table_repository.get(db, table_id)
        if not table or table.deleted_at or not table.is_active:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Table not found")
        return table

    def _get_menu_item(self, db: Session, item_id: UUID) -> MenuItem:
        item = self.menu_item_repository.get(db, item_id)
        if not item or item.deleted_at or not item.is_enabled or not item.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Menu item {item_id} not available",
            )
        return item

    def _generate_order_number(self, db: Session) -> str:
        now = datetime.now(timezone.utc)
        prefix = now.strftime("%y%m%d%H%M%S")
        # Insert a temp order to get an id for a unique number, then update.
        # However, for simplicity, use a random suffix and a sequence from the DB.
        import secrets

        suffix = secrets.randbelow(10000)
        return f"ORD{prefix}-{suffix:04d}"

    def create_order(self, db: Session, data: OrderCreate) -> Order:
        table = self._get_table(db, data.table_id)
        order_type = "standing" if table.is_standing else "table"

        order_data = {
            "order_number": self._generate_order_number(db),
            "table_id": data.table_id,
            "order_type": order_type,
            "status": "pending",
            "payment_method": data.payment_method,
            "payment_status": "pending",
            "notes": data.notes,
            "total_amount": Decimal(0),
        }

        order = self.order_repository.create(db, order_data)

        total = Decimal(0)
        order_items = []
        for item_in in data.items:
            menu_item = self._get_menu_item(db, item_in.menu_item_id)
            line_total = menu_item.price * item_in.quantity
            total += line_total
            order_items.append(
                {
                    "order_id": order.id,
                    "menu_item_id": menu_item.id,
                    "quantity": item_in.quantity,
                    "unit_price": menu_item.price,
                    "notes": item_in.notes,
                }
            )

        for item_payload in order_items:
            self.order_item_repository.create(db, item_payload)

        order.total_amount = total
        # Regenerate order number using id to ensure uniqueness
        order.order_number = f"ORD{datetime.now(timezone.utc).strftime('%y%m%d%H%M%S')}-{order.id.hex[:6].upper()}"
        db.commit()
        db.refresh(order)

        self.history_repository.create_for_order(db, order.id, "pending", actor="system")

        return order

    def get_order(self, db: Session, order_id: UUID) -> Order:
        order = self.order_repository.get(db, order_id)
        if not order or order.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def get_order_by_number(self, db: Session, order_number: str) -> Order:
        order = self.order_repository.get_by_number(db, order_number)
        if not order or order.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def list_orders(self, db: Session, *, active_only: bool = False, limit: int = 100) -> list[Order]:
        if active_only:
            return self.order_repository.get_active_orders(db)
        return self.order_repository.get_all(db, limit=limit)

    def _validate_status_transition(self, current: str, new: str) -> None:
        if current == new:
            return
        if new == "cancelled":
            if current == "completed":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot cancel completed order")
            return
        if current == "cancelled":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot update cancelled order")
        if new == "completed" and current != "ready":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order must be ready before completed")

    async def update_status(
        self, db: Session, order_id: UUID, data: OrderUpdateStatus, actor: str | None = None
    ) -> Order:
        order = self.get_order(db, order_id)
        self._validate_status_transition(order.status, data.status)
        order.status = data.status
        if data.status == "completed":
            order.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(order)
        self.history_repository.create_for_order(db, order.id, data.status, actor=actor)
        await manager.broadcast_order_update(str(order.id), order.status)
        return order

    async def mark_paid(self, db: Session, order_id: UUID) -> Order:
        order = self.get_order(db, order_id)
        order.payment_status = "paid"
        db.commit()
        db.refresh(order)
        await manager.broadcast_order_update(str(order.id), order.status, message="Payment received")
        return order

    def get_recent_orders(self, db: Session, limit: int = 20) -> list[Order]:
        return (
            db.query(Order)
            .filter(Order.deleted_at.is_(None))
            .order_by(Order.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_live_orders(self, db: Session) -> list[Order]:
        return self.order_repository.get_active_orders(db)

    def get_orders_by_table(self, db: Session, table_id: UUID) -> list[Order]:
        return self.order_repository.get_by_table(db, table_id, active_only=True)
