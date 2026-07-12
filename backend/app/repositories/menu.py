from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.menu import MenuCategory, MenuItem


class MenuRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_categories(
        self, mess_id: UUID, *, public_only: bool = False
    ) -> list[MenuCategory]:
        query = (
            select(MenuCategory)
            .where(MenuCategory.mess_id == mess_id, MenuCategory.deleted_at.is_(None))
            .options(selectinload(MenuCategory.items))
            .order_by(MenuCategory.display_order, MenuCategory.name)
        )
        if public_only:
            query = query.where(MenuCategory.is_active.is_(True))
        categories = list((await self.session.scalars(query)).unique())
        if public_only:
            for category in categories:
                category.items = [
                    item
                    for item in category.items
                    if item.deleted_at is None and item.is_available
                ]
        return categories

    async def get_category(self, mess_id: UUID, category_id: UUID) -> MenuCategory | None:
        result = await self.session.scalars(
            select(MenuCategory).where(
                MenuCategory.id == category_id,
                MenuCategory.mess_id == mess_id,
                MenuCategory.deleted_at.is_(None),
            )
        )
        return result.one_or_none()

    async def get_item(self, mess_id: UUID, item_id: UUID) -> MenuItem | None:
        result = await self.session.scalars(
            select(MenuItem)
            .join(MenuCategory)
            .where(
                MenuItem.id == item_id,
                MenuItem.deleted_at.is_(None),
                MenuCategory.mess_id == mess_id,
                MenuCategory.deleted_at.is_(None),
            )
        )
        return result.one_or_none()

    async def get_available_items(
        self, mess_id: UUID, item_ids: set[UUID]
    ) -> dict[UUID, MenuItem]:
        items = await self.session.scalars(
            select(MenuItem)
            .join(MenuCategory)
            .where(
                MenuItem.id.in_(item_ids),
                MenuItem.deleted_at.is_(None),
                MenuItem.is_available.is_(True),
                MenuCategory.mess_id == mess_id,
                MenuCategory.deleted_at.is_(None),
                MenuCategory.is_active.is_(True),
            )
        )
        return {item.id: item for item in items}
