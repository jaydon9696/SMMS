import asyncio
import os
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.enums import UserRole
from app.models.menu import MenuCategory, MenuItem
from app.models.mess import Mess
from app.models.table import RestaurantTable
from app.models.user import User


async def seed() -> None:
    async with SessionLocal() as session:
        mess = await session.scalar(select(Mess).where(Mess.slug == "demo-mess"))
        if mess is None:
            mess = Mess(name="Smart Mess", slug="demo-mess")
            session.add(mess)
            await session.flush()

        admin_email = os.getenv("ADMIN_EMAIL", "admin@smms.local").lower()
        admin = await session.scalar(
            select(User).where(User.mess_id == mess.id, User.email == admin_email)
        )
        if admin is None:
            admin = User(
                mess_id=mess.id,
                email=admin_email,
                full_name=os.getenv("ADMIN_NAME", "Mess Owner"),
                hashed_password=hash_password(
                    os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
                ),
                role=UserRole.ADMIN,
            )
            session.add(admin)

        existing_table = await session.scalar(
            select(RestaurantTable).where(RestaurantTable.mess_id == mess.id).limit(1)
        )
        if existing_table is None:
            session.add_all(
                [RestaurantTable(mess_id=mess.id, number=number) for number in range(1, 11)]
            )

        category = await session.scalar(
            select(MenuCategory).where(
                MenuCategory.mess_id == mess.id, MenuCategory.name == "Popular"
            )
        )
        if category is None:
            category = MenuCategory(
                mess_id=mess.id,
                name="Popular",
                description="Freshly prepared customer favourites",
            )
            session.add(category)
            await session.flush()
            session.add_all(
                [
                    MenuItem(
                        category_id=category.id,
                        name="Veg Thali",
                        description="Rice, dal, seasonal sabzi, roti and salad",
                        price=Decimal("120.00"),
                    ),
                    MenuItem(
                        category_id=category.id,
                        name="Paneer Rice Bowl",
                        description="Jeera rice with homestyle paneer curry",
                        price=Decimal("150.00"),
                    ),
                    MenuItem(
                        category_id=category.id,
                        name="Masala Chaas",
                        description="Chilled spiced buttermilk",
                        price=Decimal("30.00"),
                    ),
                ]
            )
        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
