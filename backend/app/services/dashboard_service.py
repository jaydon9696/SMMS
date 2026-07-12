from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from app.repositories.order_repository import OrderRepository
from app.repositories.table_repository import TableRepository
from app.services.table_service import TableService


class DashboardService:
    def __init__(
        self,
        order_repository: OrderRepository | None = None,
        table_repository: TableRepository | None = None,
    ) -> None:
        self.order_repository = order_repository or OrderRepository()
        self.table_repository = table_repository or TableRepository()
        self.table_service = TableService(
            table_repository=self.table_repository,
            order_repository=self.order_repository,
        )

    def summary(self, db: Session) -> dict:
        return {
            "today_revenue": self.order_repository.get_today_revenue(db),
            "orders_today": len(self.order_repository.get_today_orders(db)),
            "pending": self.order_repository.count_by_status(db, "pending"),
            "preparing": self.order_repository.count_by_status(db, "preparing"),
            "ready": self.order_repository.count_by_status(db, "ready"),
            "completed": self.order_repository.count_by_status(db, "completed"),
        }

    def live_orders(self, db: Session) -> list[dict]:
        orders = self.order_repository.get_active_orders(db)
        result = []
        for order in orders:
            result.append(
                {
                    "id": order.id,
                    "order_number": order.order_number,
                    "table_number": order.table.number if order.table else 0,
                    "status": order.status,
                    "total_amount": order.total_amount,
                }
            )
        return result

    def table_cards(self, db: Session) -> list[dict]:
        return self.table_service.get_table_statuses(db)
