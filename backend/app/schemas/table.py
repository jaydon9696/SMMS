from pydantic import BaseModel, Field

from app.schemas.common import AuditFields


class TableCreate(BaseModel):
    number: int = Field(gt=0)
    name: str | None = Field(default=None, max_length=80)
    capacity: int = Field(default=4, gt=0, le=100)
    is_active: bool = True


class TableUpdate(BaseModel):
    number: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, max_length=80)
    capacity: int | None = Field(default=None, gt=0, le=100)
    is_active: bool | None = None


class TableResponse(TableCreate, AuditFields):
    pass
