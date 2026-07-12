from datetime import timedelta

import pytest
from fastapi import HTTPException

from app.core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
)
from app.services.order_service import OrderService


def test_password_hashing():
    password = "secret-password"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong-password", hashed)


def test_token_creation(settings):
    user_id = "user-123"
    token = create_access_token(user_id, settings)
    assert isinstance(token, str)


def test_refresh_token_creation(settings):
    user_id = "user-123"
    token = create_refresh_token(user_id, settings)
    assert isinstance(token, str)


def test_status_transition_valid():
    service = OrderService()
    service._validate_status_transition("pending", "accepted")
    service._validate_status_transition("accepted", "preparing")
    service._validate_status_transition("preparing", "ready")
    service._validate_status_transition("ready", "completed")


def test_status_transition_invalid():
    service = OrderService()
    with pytest.raises(HTTPException):
        service._validate_status_transition("completed", "cancelled")
    with pytest.raises(HTTPException):
        service._validate_status_transition("pending", "completed")


def test_status_transition_cancel():
    service = OrderService()
    service._validate_status_transition("pending", "cancelled")
    service._validate_status_transition("accepted", "cancelled")
