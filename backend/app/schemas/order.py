from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class OrderItemCreate(BaseModel):
    menu_item_id: UUID
    quantity: int = Field(..., ge=1)
    notes: str | None = None


class OrderItemCreateWithPrice(OrderItemCreate):
    unit_price: Decimal = Field(..., ge=0)


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    menu_item_id: UUID
    quantity: int
    unit_price: Decimal
    notes: str | None
    menu_item_name: str = ""
    menu_item_image_url: str | None = None

    @model_validator(mode='before')
    @classmethod
    def set_menu_item(cls, data):
        if hasattr(data, 'menu_item') and data.menu_item is not None:
            data.menu_item_name = data.menu_item.name
            data.menu_item_image_url = data.menu_item.image_url
        return data


class OrderCreate(BaseModel):
    table_id: UUID
    items: list[OrderItemCreate] = Field(..., min_length=1)
    payment_method: str = "cash"
    notes: str | None = None


class OrderUpdateStatus(BaseModel):
    status: str = Field(..., pattern="^(pending|accepted|preparing|ready|completed|cancelled)$")


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    order_number: str
    table_id: UUID
    table_number: int = 0
    order_type: str
    status: str
    payment_method: str
    payment_status: str
    notes: str | None
    total_amount: Decimal
    items: list[OrderItemRead]
    created_at: str

    @model_validator(mode='before')
    @classmethod
    def prepare_data(cls, data):
        if hasattr(data, 'table') and data.table is not None:
            data.table_number = data.table.number
        if hasattr(data, 'created_at') and data.created_at is not None:
            if isinstance(data.created_at, datetime):
                data.created_at = data.created_at.isoformat()
        return data


class OrderSummary(BaseModel):
    id: UUID
    order_number: str
    table_number: int
    status: str
    total_amount: Decimal
    created_at: str
