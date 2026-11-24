import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_action_token, decode_token
from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository


@pytest.mark.asyncio
async def test_reset_password_token_validation_without_consuming(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    user, _ = await create_mock_user(password="OldPassword123")
    action_repo = ActionTokenRepository(db_session)

    # Create valid reset token
    token = create_action_token(subject=str(user.id), action="reset_password")
    payload = decode_token(token, expected_type="reset_password")
    await action_repo.create(
        jti=payload["jti"],
        user_id=user.id,
        token_type="reset_password",
        is_used=False,
        expires_at=datetime.fromtimestamp(payload["exp"], tz=UTC),
    )
    await db_session.commit()

    # Validate multiple times — remains valid and is NOT consumed
    for _ in range(2):
        res = await async_client.get(
            "/api/v1/auth/reset-password/validate", params={"token": token}
        )
        assert res.status_code == 200
        assert res.json() == {"valid": True, "reason": "valid"}

    # Still usable for actual reset
    reset_res = await async_client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "NewPassword123!"},
    )
    assert reset_res.status_code == 200

    # Now validate reports used
    used_res = await async_client.get(
        "/api/v1/auth/reset-password/validate", params={"token": token}
    )
    assert used_res.status_code == 200
    assert used_res.json() == {"valid": False, "reason": "used"}

    # Expired token reports expired
    expired_token = create_action_token(
        subject=str(user.id),
        action="reset_password",
        expires_delta=timedelta(seconds=-10),
    )
    exp_res = await async_client.get(
        "/api/v1/auth/reset-password/validate", params={"token": expired_token}
    )
    assert exp_res.status_code == 200
    assert exp_res.json() == {"valid": False, "reason": "expired"}

    # Wrong token type / malformed reports invalid
    wrong_type = create_action_token(subject=str(user.id), action="verify_email")
    inv_res = await async_client.get(
        "/api/v1/auth/reset-password/validate", params={"token": wrong_type}
    )
    assert inv_res.status_code == 200
    assert inv_res.json() == {"valid": False, "reason": "invalid"}

    malformed_res = await async_client.get(
        "/api/v1/auth/reset-password/validate", params={"token": "not-a-jwt"}
    )
    assert malformed_res.status_code == 200
    assert malformed_res.json() == {"valid": False, "reason": "invalid"}


@pytest.mark.asyncio
async def test_email_change_flow_validate_confirm_and_revoke_sessions(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    old_email = f"old_{uuid.uuid4().hex[:8]}@example.com"
    new_email = f"new_{uuid.uuid4().hex[:8]}@example.com"
    taken_email = f"taken_{uuid.uuid4().hex[:8]}@example.com"

    user, access_token = await create_mock_user(
        email=old_email, password="StrongPassword123"
    )
    await create_mock_user(email=taken_email, password="StrongPassword123")

    token_repo = RefreshTokenRepository(db_session)
    refresh_row = await token_repo.create(
        token_hash=f"hash_{uuid.uuid4().hex}",
        user_id=user.id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    await db_session.commit()

    headers = {"Authorization": f"Bearer {access_token}"}

    # Rejects same email
    same_res = await async_client.post(
        "/api/v1/users/me/email-change",
        headers=headers,
        json={"new_email": old_email, "current_password": "StrongPassword123"},
    )
    assert same_res.status_code == 400

    # Rejects wrong password
    wrong_pwd = await async_client.post(
        "/api/v1/users/me/email-change",
        headers=headers,
        json={"new_email": new_email, "current_password": "WrongPassword123"},
    )
    assert wrong_pwd.status_code == 400

    # Rejects already-taken email
    taken_res = await async_client.post(
        "/api/v1/users/me/email-change",
        headers=headers,
        json={"new_email": taken_email, "current_password": "StrongPassword123"},
    )
    assert taken_res.status_code == 409

    # Request email change and capture sent token
    sent_tokens: list[str] = []

    async def fake_send_confirm(self, target_email: str, token: str) -> None:
        sent_tokens.append(token)

    with (
        patch(
            "app.core.mail.MailService.send_email_change_confirmation",
            new=fake_send_confirm,
        ),
        patch(
            "app.core.mail.MailService.send_email_change_notice",
            new=AsyncMock(),
        ),
    ):
        req_res = await async_client.post(
            "/api/v1/users/me/email-change",
            headers=headers,
            json={"new_email": new_email, "current_password": "StrongPassword123"},
        )
    assert req_res.status_code == 200
    assert len(sent_tokens) == 1
    change_token = sent_tokens[0]

    # Validate token without consuming
    val_res = await async_client.get(
        "/api/v1/auth/email-change/validate", params={"token": change_token}
    )
    assert val_res.status_code == 200
    assert val_res.json() == {"valid": True, "reason": "valid"}

    # Confirm email change (works without auth header)
    confirm_res = await async_client.post(
        "/api/v1/auth/confirm-email-change",
        json={"token": change_token},
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["email"] == new_email
    assert confirm_res.json()["is_verified"] is True

    # Refresh token revoked, DB email updated
    await db_session.refresh(refresh_row)
    await db_session.refresh(user)
    assert refresh_row.revoked is True
    assert user.email == new_email

    # Token is now reported as used
    val_after = await async_client.get(
        "/api/v1/auth/email-change/validate", params={"token": change_token}
    )
    assert val_after.status_code == 200
    assert val_after.json() == {"valid": False, "reason": "used"}
