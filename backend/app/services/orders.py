from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import ORDER_STATUS_TRANSITIONS, OrderSource, OrderStatus
from app.models.order import Order, OrderItem, OrderStatusHistory
from app.models.table import RestaurantTable
from app.repositories.menu import MenuRepository
from app.repositories.order import OrderRepository
from app.schemas.order import OrderCreate


class OrderService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.menu_repository = MenuRepository(session)
        self.order_repository = OrderRepository(session)

    async def create(
        self, mess_id: UUID, payload: OrderCreate, idempotency_key: str
    ) -> tuple[Order, bool]:
        existing = await self.order_repository.get_by_idempotency_key(
            mess_id, idempotency_key
        )
        if existing is not None:
            return existing, False
        item_ids = {item.menu_item_id for item in payload.items}
        menu_items = await self.menu_repository.get_available_items(mess_id, item_ids)
        if set(menu_items) != item_ids:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="One or more menu items are unavailable",
            )

        table: RestaurantTable | None = None
        if payload.source == OrderSource.TABLE:
            table = await self.session.scalar(
                select(RestaurantTable).where(
                    RestaurantTable.mess_id == mess_id,
                    RestaurantTable.number == payload.table_number,
                    RestaurantTable.is_active.is_(True),
                    RestaurantTable.deleted_at.is_(None),
                )
            )
            if table is None:
                raise HTTPException(status_code=404, detail="Table not found")

        total = Decimal("0.00")
        order_items: list[OrderItem] = []
        for requested_item in payload.items:
            menu_item = menu_items[requested_item.menu_item_id]
            line_total = menu_item.price * requested_item.quantity
            total += line_total
            order_items.append(
                OrderItem(
                    menu_item_id=menu_item.id,
                    item_name=menu_item.name,
                    quantity=requested_item.quantity,
                    unit_price=menu_item.price,
                    line_total=line_total,
                    note=requested_item.note,
                )
            )

        public_id = uuid4()
        order = Order(
            mess_id=mess_id,
            table_id=table.id if table else None,
            public_id=public_id,
            idempotency_key=idempotency_key,
            order_number=f"SM-{datetime.now(UTC):%y%m%d}-{public_id.hex[:8].upper()}",
            source=payload.source,
            payment_method=payload.payment_method,
            customer_note=payload.customer_note,
            total_amount=total,
            items=order_items,
            status_history=[OrderStatusHistory(status=OrderStatus.PENDING)],
        )
        self.session.add(order)
        await self.session.commit()
        await self.session.refresh(order, attribute_names=["items"])
        return order, True

    async def update_status(
        self, mess_id: UUID, order_id: UUID, new_status: OrderStatus, changed_by: UUID
    ) -> Order:
        order = await self.order_repository.get_for_update(mess_id, order_id)
        if order is None:
            raise HTTPException(status_code=404, detail="Order not found")
        if new_status not in ORDER_STATUS_TRANSITIONS[order.status]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot transition order from {order.status} to {new_status}",
            )
        order.status = new_status
        if new_status == OrderStatus.COMPLETED:
            order.completed_at = datetime.now(UTC)
        order.status_history.append(
            OrderStatusHistory(status=new_status, changed_by_user_id=changed_by)
        )
        await self.session.commit()
        await self.session.refresh(order, attribute_names=["items"])
        return order
