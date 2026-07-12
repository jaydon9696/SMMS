from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import OrderSource, OrderStatus, PaymentMethod, PaymentStatus

if TYPE_CHECKING:
    from app.models.menu import MenuItem
    from app.models.mess import Mess
    from app.models.table import RestaurantTable


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        UniqueConstraint("mess_id", "order_number", name="uq_orders_mess_order_number"),
        UniqueConstraint("mess_id", "idempotency_key", name="uq_orders_mess_idempotency"),
        CheckConstraint("total_amount >= 0", name="total_non_negative"),
        CheckConstraint(
            "(source = 'table' AND table_id IS NOT NULL) OR "
            "(source = 'standing' AND table_id IS NULL)",
            name="source_table_consistent",
        ),
        Index("ix_orders_mess_status_created", "mess_id", "status", "created_at"),
    )

    mess_id: Mapped[UUID] = mapped_column(ForeignKey("messes.id"), index=True, nullable=False)
    table_id: Mapped[UUID | None] = mapped_column(ForeignKey("restaurant_tables.id"), index=True)
    public_id: Mapped[UUID] = mapped_column(Uuid, default=uuid4, unique=True, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    order_number: Mapped[str] = mapped_column(String(32), nullable=False)
    source: Mapped[OrderSource] = mapped_column(
        Enum(OrderSource, native_enum=False), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False), default=OrderStatus.PENDING, nullable=False
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, native_enum=False), nullable=False
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, native_enum=False), default=PaymentStatus.UNPAID, nullable=False
    )
    customer_note: Mapped[str | None] = mapped_column(Text)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    mess: Mapped["Mess"] = relationship(back_populates="orders")
    table: Mapped["RestaurantTable | None"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    status_history: Mapped[list["OrderStatusHistory"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderStatusHistory.created_at",
    )


class OrderItem(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="quantity_positive"),
        CheckConstraint("unit_price >= 0", name="unit_price_non_negative"),
        CheckConstraint("line_total >= 0", name="line_total_non_negative"),
    )

    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    menu_item_id: Mapped[UUID] = mapped_column(ForeignKey("menu_items.id"), index=True)
    item_name: Mapped[str] = mapped_column(String(120), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    order: Mapped[Order] = relationship(back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship(back_populates="order_items")


class OrderStatusHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "order_status_history"

    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, native_enum=False), nullable=False
    )
    changed_by_user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    order: Mapped[Order] = relationship(back_populates="status_history")
