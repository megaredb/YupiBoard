from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.exc import OperationalError

from app.core.database import get_db
from app.core.mail import MailService
from app.main import app
from app.scripts.export_openapi import export_openapi


@pytest.mark.asyncio
async def test_health_check_success(async_client: AsyncClient) -> None:
    res = await async_client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_health_check_database_error(async_client: AsyncClient) -> None:
    async def override_failing_db():
        session = AsyncMock()
        session.execute.side_effect = OperationalError(
            "Connection refused", {}, Exception("Connection refused")
        )
        yield session

    app.dependency_overrides[get_db] = override_failing_db
    try:
        res = await async_client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "degraded"
        assert "unhealthy" in data["database"]
    finally:
        from tests.conftest import override_get_db

        app.dependency_overrides[get_db] = override_get_db


@pytest.mark.asyncio
async def test_mail_service_dispatch() -> None:
    mail_service = MailService()

    # Test send_verification_email
    await mail_service.send_verification_email(
        "recipient@example.com", "test-verification-token"
    )

    # Test send_password_reset_email
    await mail_service.send_password_reset_email(
        "recipient@example.com", "test-reset-token"
    )


@pytest.mark.asyncio
async def test_mail_service_mock_mode() -> None:
    with patch("app.core.mail.settings.MAIL_SERVER", ""):
        service = MailService()
        assert service.enabled is False
        assert service.fastmail is None
        # Should not raise exception
        await service.send_verification_email("mock@example.com", "token123")


@pytest.mark.asyncio
async def test_mail_service_error_handling() -> None:
    service = MailService()
    if service.fastmail:
        with patch.object(
            service.fastmail,
            "send_message",
            side_effect=Exception("SMTP connection timeout"),
        ):
            # In development (is_production=False), error should be caught and logged
            await service.send_verification_email("error@example.com", "tok")


def test_export_openapi_script(tmp_path: Path) -> None:
    output_file = tmp_path / "test_openapi.json"
    export_openapi(output_file)
    assert output_file.exists()
    assert output_file.stat().st_size > 0
