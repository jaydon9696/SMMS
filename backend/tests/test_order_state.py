import pytest

from app.models.enums import ORDER_STATUS_TRANSITIONS, OrderStatus


def test_order_status_follows_operational_sequence() -> None:
    assert OrderStatus.ACCEPTED in ORDER_STATUS_TRANSITIONS[OrderStatus.PENDING]
    assert OrderStatus.PREPARING in ORDER_STATUS_TRANSITIONS[OrderStatus.ACCEPTED]
    assert OrderStatus.READY in ORDER_STATUS_TRANSITIONS[OrderStatus.PREPARING]
    assert OrderStatus.COMPLETED in ORDER_STATUS_TRANSITIONS[OrderStatus.READY]


@pytest.mark.parametrize(
    ("current", "invalid"),
    [
        (OrderStatus.PENDING, OrderStatus.READY),
        (OrderStatus.ACCEPTED, OrderStatus.COMPLETED),
        (OrderStatus.COMPLETED, OrderStatus.PENDING),
        (OrderStatus.CANCELLED, OrderStatus.ACCEPTED),
    ],
)
def test_order_status_rejects_invalid_transitions(
    current: OrderStatus, invalid: OrderStatus
) -> None:
    assert invalid not in ORDER_STATUS_TRANSITIONS[current]
