from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.enums import OrderSource, OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.common import ORMModel


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = Field(gt=0, le=50)
    note: str | None = Field(default=None, max_length=500)


class OrderCreate(BaseModel):
    source: OrderSource
    table_number: int | None = Field(default=None, gt=0)
    payment_method: PaymentMethod
    customer_note: str | None = Field(default=None, max_length=1000)
    items: list[OrderItemCreate] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_source(self) -> "OrderCreate":
        if self.source == OrderSource.TABLE and self.table_number is None:
            raise ValueError("table_number is required for table orders")
        if self.source == OrderSource.STANDING and self.table_number is not None:
            raise ValueError("table_number must be omitted for standing orders")
        return self


class OrderItemResponse(ORMModel):
    id: UUID
    menu_item_id: UUID
    item_name: str
    quantity: int
    unit_price: Decimal
    line_total: Decimal
    note: str | None


class OrderResponse(ORMModel):
    id: UUID
    public_id: UUID
    order_number: str
    source: OrderSource
    table_id: UUID | None
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    customer_note: str | None
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    items: list[OrderItemResponse]


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
