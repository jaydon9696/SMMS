from uuid import UUID

from pydantic import BaseModel


class TableCreate(BaseModel):
    number: int
    is_standing: bool = False
    is_active: bool = True


class TableUpdate(BaseModel):
    number: int | None = None
    is_active: bool | None = None


class TableRead(BaseModel):
    id: UUID
    number: int
    is_standing: bool
    is_active: bool

    class Config:
        from_attributes = True


class TableStatusRead(TableRead):
    current_status: str | None = None
    order_id: UUID | None = None
    total_amount: float | None = None
