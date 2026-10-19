import pytest

from app.core.config import parse_cors, settings
from app.core.exceptions import (
    AppException,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)


def test_parse_cors() -> None:
    # Comma-separated string
    assert parse_cors("http://localhost:3000, https://example.com") == [
        "http://localhost:3000",
        "https://example.com",
    ]
    # Python list
    assert parse_cors(["http://localhost:3000"]) == ["http://localhost:3000"]
    # JSON string
    assert parse_cors('["http://localhost:3000"]') == ["http://localhost:3000"]
    # Empty / other string
    assert parse_cors("") == []


def test_custom_exceptions_status_codes() -> None:
    exc_404 = NotFoundException("Resource missing")
    assert exc_404.status_code == 404
    assert exc_404.detail == "Resource missing"
    assert isinstance(exc_404, AppException)

    exc_401 = UnauthorizedException("Not logged in")
    assert exc_401.status_code == 401
    assert exc_401.headers == {"WWW-Authenticate": "Bearer"}

    exc_403 = ForbiddenException("Access denied")
    assert exc_403.status_code == 403

    exc_409 = ConflictException("Already exists")
    assert exc_409.status_code == 409

    exc_400 = BadRequestException("Malformed data")
    assert exc_400.status_code == 400


def test_settings_properties() -> None:
    assert settings.PROJECT_NAME == "YupiBoard"
    assert "postgresql" in settings.DATABASE_URL
    assert isinstance(settings.is_production, bool)


@pytest.mark.asyncio
async def test_get_async_session_generator() -> None:
    from app.core.database import get_async_session

    async for session in get_async_session():
        assert session is not None
        break


@pytest.mark.asyncio
async def test_app_lifespan_and_exception_handler() -> None:
    from unittest.mock import MagicMock

    from app.main import app, app_exception_handler, lifespan

    async with lifespan(app):
        pass

    mock_request = MagicMock()
    exc_with_extra = AppException(
        status_code=418, detail="I am a teapot", extra={"reason": "short and stout"}
    )
    res = await app_exception_handler(mock_request, exc_with_extra)
    assert res.status_code == 418
    import json

    data = json.loads(res.body.decode())
    assert data["detail"] == "I am a teapot"
    assert data["extra"]["reason"] == "short and stout"
