from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    today_revenue: Decimal
    orders_today: int
    pending: int
    preparing: int
    ready: int
    completed: int


class LiveOrder(BaseModel):
    id: UUID
    order_number: str
    table_number: int
    status: str
    total_amount: Decimal

    class Config:
        from_attributes = True


class TableCard(BaseModel):
    id: UUID
    number: int
    status: str | None
    order_id: UUID | None
