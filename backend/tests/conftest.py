import pytest
from app.core.config import get_settings


@pytest.fixture
def settings():
    return get_settings()
