from datetime import date
from decimal import Decimal

from pydantic import BaseModel

from app.models.enums import OrderStatus, PaymentMethod


class DashboardSummary(BaseModel):
    business_date: date
    revenue: Decimal
    orders: int
    pending: int
    preparing: int
    ready: int
    completed: int
    occupied_tables: int
    standing_orders: int


class PopularItem(BaseModel):
    name: str
    quantity: int
    revenue: Decimal


class PaymentSummary(BaseModel):
    method: PaymentMethod
    orders: int
    amount: Decimal


class DailyReport(BaseModel):
    business_date: date
    revenue: Decimal
    order_count: int
    by_status: dict[OrderStatus, int]
    payments: list[PaymentSummary]
    popular_items: list[PopularItem]
