from enum import StrEnum


class UserRole(StrEnum):
    ADMIN = "admin"


class OrderSource(StrEnum):
    TABLE = "table"
    STANDING = "standing"


class PaymentMethod(StrEnum):
    CASH = "cash"
    PAY_AT_COUNTER = "pay_at_counter"


class PaymentStatus(StrEnum):
    UNPAID = "unpaid"
    PAID = "paid"


class OrderStatus(StrEnum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    PREPARING = "preparing"
    READY = "ready"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


ORDER_STATUS_TRANSITIONS: dict[OrderStatus, frozenset[OrderStatus]] = {
    OrderStatus.PENDING: frozenset({OrderStatus.ACCEPTED, OrderStatus.CANCELLED}),
    OrderStatus.ACCEPTED: frozenset({OrderStatus.PREPARING, OrderStatus.CANCELLED}),
    OrderStatus.PREPARING: frozenset({OrderStatus.READY, OrderStatus.CANCELLED}),
    OrderStatus.READY: frozenset({OrderStatus.COMPLETED}),
    OrderStatus.COMPLETED: frozenset(),
    OrderStatus.CANCELLED: frozenset(),
}
