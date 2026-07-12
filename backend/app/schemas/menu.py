from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MenuCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sort_order: int = 0
    is_active: bool = True


class MenuCategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    sort_order: int | None = None
    is_active: bool | None = None


class MenuCategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    sort_order: int
    is_active: bool


class MenuItemCreate(BaseModel):
    category_id: UUID
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    price: Decimal = Field(..., ge=0)
    image_url: str | None = None
    is_available: bool = True
    is_enabled: bool = True
    sort_order: int = 0


class MenuItemUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    price: Decimal | None = Field(None, ge=0)
    image_url: str | None = None
    is_available: bool | None = None
    is_enabled: bool | None = None
    sort_order: int | None = None


class MenuItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    category_id: UUID
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    is_enabled: bool
    sort_order: int


class MenuCategoryWithItems(MenuCategoryRead):
    items: list[MenuItemRead]
