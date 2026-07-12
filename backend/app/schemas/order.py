from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = Field(..., ge=1)
    notes: str | None = None


class OrderItemCreateWithPrice(OrderItemCreate):
    unit_price: Decimal = Field(..., ge=0)


class OrderItemRead(BaseModel):
    id: UUID
    menu_item_id: UUID
    quantity: int
    unit_price: Decimal
    notes: str | None
    menu_item_name: str
    menu_item_image_url: str | None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    table_id: UUID
    items: list[OrderItemCreate] = Field(..., min_length=1)
    payment_method: str = "cash"
    notes: str | None = None


class OrderUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|accepted|preparing|ready|completed|cancelled)$")


class OrderRead(BaseModel):
    id: UUID
    order_number: str
    table_id: UUID
    order_type: str
    status: str
    payment_method: str
    payment_status: str
    notes: str | None
    total_amount: Decimal
    items: list[OrderItemRead]
    created_at: str

    class Config:
        from_attributes = True


class OrderSummary(BaseModel):
    id: UUID
    order_number: str
    table_number: int
    status: str
    total_amount: Decimal
    created_at: str
