from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.order import Order, OrderItem, OrderStatusHistory
from app.repositories.base import BaseRepository


class OrderRepository(BaseRepository[Order]):
    def __init__(self) -> None:
        super().__init__(Order)

    def get_by_number(self, db: Session, order_number: str) -> Order | None:
        return db.query(Order).filter(
            Order.order_number == order_number,
            Order.deleted_at.is_(None),
        ).first()

    def get_by_table(self, db: Session, table_id: UUID, active_only: bool = False) -> list[Order]:
        query = db.query(Order).filter(
            Order.table_id == table_id,
            Order.deleted_at.is_(None),
        )
        if active_only:
            query = query.filter(Order.status.notin_(["completed", "cancelled"]))
        return query.order_by(Order.created_at.desc()).all()

    def get_active_orders(self, db: Session) -> list[Order]:
        return db.query(Order).filter(
            Order.deleted_at.is_(None),
            Order.status.notin_(["completed", "cancelled"]),
        ).order_by(Order.created_at.desc()).all()

    def get_today_orders(self, db: Session) -> list[Order]:
        today = date.today()
        return db.query(Order).filter(
            Order.deleted_at.is_(None),
            func.date(Order.created_at) == today,
        ).order_by(Order.created_at.desc()).all()

    def get_today_revenue(self, db: Session) -> Decimal:
        today = date.today()
        result = db.query(func.coalesce(func.sum(Order.total_amount), Decimal(0))).filter(
            Order.deleted_at.is_(None),
            func.date(Order.created_at) == today,
            Order.status == "completed",
        ).scalar()
        return result or Decimal(0)

    def count_by_status(self, db: Session, status: str) -> int:
        return db.query(Order).filter(
            Order.deleted_at.is_(None),
            Order.status == status,
        ).count()

    def get_popular_items(self, db: Session, limit: int = 5) -> list[dict]:
        return (
            db.query(
                OrderItem.menu_item_id,
                func.sum(OrderItem.quantity).label("total_sold"),
                func.min(OrderItem.unit_price).label("unit_price"),
            )
            .join(Order, Order.id == OrderItem.order_id)
            .filter(Order.deleted_at.is_(None), Order.status != "cancelled")
            .group_by(OrderItem.menu_item_id)
            .order_by(func.sum(OrderItem.quantity).desc())
            .limit(limit)
            .all()
        )


class OrderItemRepository(BaseRepository[OrderItem]):
    def __init__(self) -> None:
        super().__init__(OrderItem)


class OrderStatusHistoryRepository(BaseRepository[OrderStatusHistory]):
    def __init__(self) -> None:
        super().__init__(OrderStatusHistory)

    def create_for_order(
        self, db: Session, order_id: UUID, status: str, actor: str | None = None
    ) -> OrderStatusHistory:
        return self.create(
            db, {"order_id": order_id, "status": status, "actor": actor, "created_at": datetime.now(timezone.utc)}
        )
