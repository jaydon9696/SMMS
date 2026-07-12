from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.models.enums import OrderSource, PaymentMethod
from app.schemas.order import OrderCreate


def test_table_order_requires_table_number() -> None:
    with pytest.raises(ValidationError):
        OrderCreate(
            source=OrderSource.TABLE,
            payment_method=PaymentMethod.CASH,
            items=[{"menu_item_id": uuid4(), "quantity": 1}],
        )


def test_standing_order_rejects_table_number() -> None:
    with pytest.raises(ValidationError):
        OrderCreate(
            source=OrderSource.STANDING,
            table_number=1,
            payment_method=PaymentMethod.PAY_AT_COUNTER,
            items=[{"menu_item_id": uuid4(), "quantity": 1}],
        )


def test_order_requires_at_least_one_item() -> None:
    with pytest.raises(ValidationError):
        OrderCreate(
            source=OrderSource.STANDING,
            payment_method=PaymentMethod.CASH,
            items=[],
        )
