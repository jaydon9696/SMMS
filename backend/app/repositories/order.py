from datetime import UTC, date, datetime, time
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.enums import OrderStatus
from app.models.order import Order


class OrderRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def with_items(query: Select[tuple[Order]]) -> Select[tuple[Order]]:
        return query.options(selectinload(Order.items))

    async def get_by_public_id(self, public_id: UUID) -> Order | None:
        result = await self.session.scalars(
            self.with_items(select(Order).where(Order.public_id == public_id))
        )
        return result.one_or_none()

    async def get_by_idempotency_key(
        self, mess_id: UUID, idempotency_key: str
    ) -> Order | None:
        result = await self.session.scalars(
            self.with_items(
                select(Order).where(
                    Order.mess_id == mess_id,
                    Order.idempotency_key == idempotency_key,
                )
            )
        )
        return result.one_or_none()

    async def get_for_update(self, mess_id: UUID, order_id: UUID) -> Order | None:
        result = await self.session.scalars(
            self.with_items(
                select(Order)
                .where(Order.id == order_id, Order.mess_id == mess_id)
                .with_for_update()
            )
        )
        return result.one_or_none()

    async def list(
        self, mess_id: UUID, status: OrderStatus | None = None, limit: int = 100
    ) -> list[Order]:
        query = select(Order).where(Order.mess_id == mess_id)
        if status is not None:
            query = query.where(Order.status == status)
        query = self.with_items(query.order_by(Order.created_at.desc()).limit(limit))
        return list((await self.session.scalars(query)).unique())

    @staticmethod
    def day_bounds(business_date: date) -> tuple[datetime, datetime]:
        return (
            datetime.combine(business_date, time.min, tzinfo=UTC),
            datetime.combine(business_date, time.max, tzinfo=UTC),
        )
