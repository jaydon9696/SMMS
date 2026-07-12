from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.common import AuditFields


class MenuItemBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: Decimal = Field(ge=0, decimal_places=2)
    image_url: HttpUrl | None = None
    is_available: bool = True
    is_vegetarian: bool = True
    display_order: int = Field(default=0, ge=0)


class MenuItemCreate(MenuItemBase):
    category_id: UUID


class MenuItemUpdate(BaseModel):
    category_id: UUID | None = None
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    price: Decimal | None = Field(default=None, ge=0, decimal_places=2)
    image_url: HttpUrl | None = None
    is_available: bool | None = None
    is_vegetarian: bool | None = None
    display_order: int | None = Field(default=None, ge=0)


class MenuItemResponse(MenuItemBase, AuditFields):
    category_id: UUID


class MenuCategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    display_order: int = Field(default=0, ge=0)
    is_active: bool = True


class MenuCategoryCreate(MenuCategoryBase):
    pass


class MenuCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = Field(default=None, max_length=1000)
    display_order: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class MenuCategoryResponse(MenuCategoryBase, AuditFields):
    items: list[MenuItemResponse] = []


class ImageUploadResponse(BaseModel):
    url: HttpUrl
    public_id: str
