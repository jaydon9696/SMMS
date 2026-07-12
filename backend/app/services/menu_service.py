from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.menu import MenuCategory, MenuItem
from app.repositories.menu_repository import MenuCategoryRepository, MenuItemRepository
from app.schemas.menu import MenuCategoryCreate, MenuCategoryUpdate, MenuItemCreate, MenuItemUpdate


class MenuService:
    def __init__(
        self,
        category_repository: MenuCategoryRepository | None = None,
        item_repository: MenuItemRepository | None = None,
    ) -> None:
        self.category_repository = category_repository or MenuCategoryRepository()
        self.item_repository = item_repository or MenuItemRepository()

    def create_category(self, db: Session, data: MenuCategoryCreate) -> MenuCategory:
        return self.category_repository.create(db, data.model_dump())

    def list_categories(self, db: Session, include_items: bool = False) -> list[MenuCategory]:
        return self.list_categories_full(db, include_items=include_items)

    def list_categories_full(self, db: Session, *, include_items: bool = False, available_only: bool = False) -> list[MenuCategory]:
        categories = self.category_repository.get_active(db)
        if include_items:
            for category in categories:
                items = [item for item in category.items if item.deleted_at is None]
                if available_only:
                    items = [item for item in items if item.is_enabled and item.is_available]
                category.items = items
        return categories

    def get_customer_menu(self, db: Session) -> list[MenuCategory]:
        return self.list_categories_full(db, include_items=True, available_only=True)

    def get_category(self, db: Session, category_id: UUID) -> MenuCategory:
        category = self.category_repository.get(db, category_id)
        if not category or category.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return category

    def update_category(
        self, db: Session, category_id: UUID, data: MenuCategoryUpdate
    ) -> MenuCategory:
        category = self.get_category(db, category_id)
        return self.category_repository.update(db, category, data.model_dump(exclude_unset=True))

    def delete_category(self, db: Session, category_id: UUID) -> MenuCategory:
        category = self.get_category(db, category_id)
        return self.category_repository.soft_delete(db, category)

    def create_item(self, db: Session, data: MenuItemCreate) -> MenuItem:
        self.get_category(db, data.category_id)
        return self.item_repository.create(db, data.model_dump())

    def list_items(self, db: Session, category_id: UUID | None = None) -> list[MenuItem]:
        if category_id:
            self.get_category(db, category_id)
        return self.item_repository.get_active_by_category(db, category_id)

    def get_item(self, db: Session, item_id: UUID) -> MenuItem:
        item = self.item_repository.get(db, item_id)
        if not item or item.deleted_at:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        return item

    def update_item(self, db: Session, item_id: UUID, data: MenuItemUpdate) -> MenuItem:
        item = self.get_item(db, item_id)
        if data.category_id:
            self.get_category(db, data.category_id)
        return self.item_repository.update(db, item, data.model_dump(exclude_unset=True))

    def delete_item(self, db: Session, item_id: UUID) -> MenuItem:
        item = self.get_item(db, item_id)
        return self.item_repository.soft_delete(db, item)
