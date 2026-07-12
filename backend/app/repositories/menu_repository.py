from uuid import UUID

from sqlalchemy.orm import Session

from app.models.menu import MenuCategory, MenuItem
from app.repositories.base import BaseRepository


class MenuCategoryRepository(BaseRepository[MenuCategory]):
    def __init__(self) -> None:
        super().__init__(MenuCategory)

    def get_active(self, db: Session) -> list[MenuCategory]:
        return db.query(MenuCategory).filter(
            MenuCategory.deleted_at.is_(None),
            MenuCategory.is_active.is_(True),
        ).order_by(MenuCategory.sort_order, MenuCategory.name).all()


class MenuItemRepository(BaseRepository[MenuItem]):
    def __init__(self) -> None:
        super().__init__(MenuItem)

    def get_active_by_category(self, db: Session, category_id: UUID | None = None) -> list[MenuItem]:
        query = db.query(MenuItem).filter(
            MenuItem.deleted_at.is_(None),
            MenuItem.is_enabled.is_(True),
            MenuItem.is_available.is_(True),
        )
        if category_id:
            query = query.filter(MenuItem.category_id == category_id)
        return query.order_by(MenuItem.sort_order, MenuItem.name).all()

    def get_by_category(self, db: Session, category_id: UUID) -> list[MenuItem]:
        return db.query(MenuItem).filter(
            MenuItem.deleted_at.is_(None),
            MenuItem.category_id == category_id,
        ).order_by(MenuItem.sort_order, MenuItem.name).all()
