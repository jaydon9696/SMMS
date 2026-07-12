from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.mess import Mess
    from app.models.order import Order


class RestaurantTable(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "restaurant_tables"
    __table_args__ = (
        UniqueConstraint("mess_id", "number", name="uq_restaurant_tables_mess_number"),
        CheckConstraint("number > 0", name="number_positive"),
        CheckConstraint("capacity > 0", name="capacity_positive"),
    )

    mess_id: Mapped[UUID] = mapped_column(ForeignKey("messes.id"), index=True, nullable=False)
    number: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str | None] = mapped_column(String(80))
    capacity: Mapped[int] = mapped_column(Integer, default=4, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    mess: Mapped["Mess"] = relationship(back_populates="tables")
    orders: Mapped[list["Order"]] = relationship(back_populates="table")
