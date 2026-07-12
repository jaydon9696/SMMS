from uuid import UUID

from fastapi import APIRouter

from app.api.deps import AdminUser, DbDep
from app.schemas.common import ApiResponse
from app.schemas.menu import (
    MenuCategoryCreate,
    MenuCategoryRead,
    MenuCategoryUpdate,
    MenuCategoryWithItems,
    MenuItemCreate,
    MenuItemRead,
    MenuItemUpdate,
)
from app.services.menu_service import MenuService

router = APIRouter()


@router.get("/categories", response_model=ApiResponse[list[MenuCategoryRead]])
def list_categories(db: DbDep):
    service = MenuService()
    return ApiResponse(data=service.list_categories(db))


@router.post("/categories", response_model=ApiResponse[MenuCategoryRead])
def create_category(data: MenuCategoryCreate, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.create_category(db, data))


@router.get("/categories/{category_id}", response_model=ApiResponse[MenuCategoryWithItems])
def get_category(category_id: UUID, db: DbDep):
    service = MenuService()
    return ApiResponse(data=service.get_category(db, category_id))


@router.put("/categories/{category_id}", response_model=ApiResponse[MenuCategoryRead])
def update_category(category_id: UUID, data: MenuCategoryUpdate, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.update_category(db, category_id, data))


@router.delete("/categories/{category_id}", response_model=ApiResponse[MenuCategoryRead])
def delete_category(category_id: UUID, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.delete_category(db, category_id))


@router.get("/items", response_model=ApiResponse[list[MenuItemRead]])
def list_items(category_id: UUID | None = None, db: DbDep):
    service = MenuService()
    return ApiResponse(data=service.list_items(db, category_id))


@router.post("/items", response_model=ApiResponse[MenuItemRead])
def create_item(data: MenuItemCreate, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.create_item(db, data))


@router.get("/items/{item_id}", response_model=ApiResponse[MenuItemRead])
def get_item(item_id: UUID, db: DbDep):
    service = MenuService()
    return ApiResponse(data=service.get_item(db, item_id))


@router.put("/items/{item_id}", response_model=ApiResponse[MenuItemRead])
def update_item(item_id: UUID, data: MenuItemUpdate, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.update_item(db, item_id, data))


@router.delete("/items/{item_id}", response_model=ApiResponse[MenuItemRead])
def delete_item(item_id: UUID, db: DbDep, user: AdminUser):
    service = MenuService()
    return ApiResponse(data=service.delete_item(db, item_id))
