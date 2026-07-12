from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.repositories.menu_repository import MenuItemRepository
from app.repositories.order_repository import OrderRepository


class ReportService:
    def __init__(
        self,
        order_repository: OrderRepository | None = None,
        menu_item_repository: MenuItemRepository | None = None,
    ) -> None:
        self.order_repository = order_repository or OrderRepository()
        self.menu_item_repository = menu_item_repository or MenuItemRepository()

    def daily_report(self, db: Session, target_date: date | None = None) -> dict:
        if target_date is None:
            target_date = date.today()
        orders = self.order_repository.get_today_orders(db)
        revenue = Decimal(0)
        payment_summary = defaultdict(Decimal)
        for order in orders:
            revenue += order.total_amount
            payment_summary[order.payment_method] += order.total_amount

        return {
            "date": target_date.isoformat(),
            "total_orders": len(orders),
            "revenue": revenue,
            "payment_summary": dict(payment_summary),
            "orders": [
                {
                    "id": order.id,
                    "order_number": order.order_number,
                    "status": order.status,
                    "total_amount": order.total_amount,
                    "payment_method": order.payment_method,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                }
                for order in orders
            ],
        }

    def popular_items(self, db: Session, limit: int = 5) -> list[dict]:
        rows = self.order_repository.get_popular_items(db, limit=limit)
        items = []
        for row in rows:
            item = self.menu_item_repository.get(db, row.menu_item_id)
            items.append(
                {
                    "menu_item_id": row.menu_item_id,
                    "name": item.name if item else "Unknown",
                    "total_sold": int(row.total_sold),
                    "unit_price": row.unit_price,
                }
            )
        return items
