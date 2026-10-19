import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_action_token, hash_token
from app.repositories.token import RefreshTokenRepository
from app.repositories.user import UserRepository


@pytest.mark.asyncio
async def test_registration_errors(async_client: AsyncClient) -> None:
    email = f"dup_{uuid.uuid4().hex[:8]}@example.com"
    payload = {"email": email, "password": "password1234", "full_name": "User 1"}

    # First registration OK
    r1 = await async_client.post("/api/v1/auth/register", json=payload)
    assert r1.status_code == 201

    # Duplicate registration returns 409 Conflict
    r2 = await async_client.post("/api/v1/auth/register", json=payload)
    assert r2.status_code == 409
    assert "already registered" in r2.json()["detail"].lower()

    # Short password returns 422 Unprocessable Entity
    r3 = await async_client.post(
        "/api/v1/auth/register",
        json={"email": f"new_{uuid.uuid4().hex[:8]}@example.com", "password": "short"},
    )
    assert r3.status_code == 422


@pytest.mark.asyncio
async def test_login_errors(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    email = f"login_err_{uuid.uuid4().hex[:8]}@example.com"
    pwd = "validpassword123"

    # Register active user
    await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": pwd, "full_name": "Login User"},
    )

    # Wrong password returns 401
    r_wrong_pwd = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "incorrectpassword"},
    )
    assert r_wrong_pwd.status_code == 401

    # Non-existent email returns 401
    r_no_user = await async_client.post(
        "/api/v1/auth/login",
        json={"email": "nobody_exists@example.com", "password": pwd},
    )
    assert r_no_user.status_code == 401

    # Deactivated user returns 401
    user_repo = UserRepository(db_session)
    user = await user_repo.get_by_email(email)
    assert user is not None
    await user_repo.update(user, is_active=False)
    await db_session.commit()

    r_deact = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": pwd},
    )
    assert r_deact.status_code == 401
    assert "deactivated" in r_deact.json()["detail"].lower()


@pytest.mark.asyncio
async def test_refresh_token_edge_cases(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    # Missing token returns 401
    r_empty = await async_client.post("/api/v1/auth/refresh", json={})
    assert r_empty.status_code == 401

    # Invalid token string returns 401
    r_invalid = await async_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": "not-a-jwt"}
    )
    assert r_invalid.status_code == 401

    # Register user and get valid refresh token
    email = f"ref_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Ref User"},
    )
    refresh_token = reg.json()["refresh_token"]

    # Cookie-based refresh
    cookie_res = await async_client.post(
        "/api/v1/auth/refresh",
        cookies={"refresh_token": refresh_token},
    )
    assert cookie_res.status_code == 200
    assert "access_token" in cookie_res.json()
    new_refresh = cookie_res.json()["refresh_token"]

    # Trying to reuse the old refresh token (revoked) returns 401
    reuse_res = await async_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
    )
    assert reuse_res.status_code == 401

    # Expired token in DB returns 401
    token_repo = RefreshTokenRepository(db_session)
    token_obj = await token_repo.get_by_hash(hash_token(new_refresh))
    assert token_obj is not None
    token_obj.expires_at = datetime.now(UTC) - timedelta(days=1)
    await db_session.commit()

    expired_res = await async_client.post(
        "/api/v1/auth/refresh", json={"refresh_token": new_refresh}
    )
    assert expired_res.status_code == 401


@pytest.mark.asyncio
async def test_email_verification_flow(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    email = f"verify_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Verify User"},
    )
    user_data = reg.json()["user"]
    assert user_data["is_verified"] is False
    user_id = user_data["id"]

    # Valid token verification
    token = create_action_token(subject=user_id, action="verify_email")
    v_res = await async_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert v_res.status_code == 200
    assert v_res.json()["is_verified"] is True

    # Re-verifying returns verified user
    v_re = await async_client.post("/api/v1/auth/verify-email", json={"token": token})
    assert v_re.status_code == 200
    assert v_re.json()["is_verified"] is True

    # Invalid action token returns 400
    bad_token = create_action_token(subject=user_id, action="wrong_action")
    bad_res = await async_client.post(
        "/api/v1/auth/verify-email", json={"token": bad_token}
    )
    assert bad_res.status_code in (400, 401)


@pytest.mark.asyncio
async def test_password_recovery_and_reset_flow(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
    old_password = "oldpassword123"
    new_password = "newstrongpassword456"

    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": old_password, "full_name": "Reset User"},
    )
    user_id = reg.json()["user"]["id"]

    # Request password recovery for existing user
    rec_res = await async_client.post(
        "/api/v1/auth/password-recovery", json={"email": email}
    )
    assert rec_res.status_code == 200
    assert "instructions" in rec_res.json()["message"].lower()

    # Request password recovery for non-existent user returns 200 without leak
    rec_no_user = await async_client.post(
        "/api/v1/auth/password-recovery", json={"email": "nobody@example.com"}
    )
    assert rec_no_user.status_code == 200

    # Reset password with valid token
    reset_token = create_action_token(subject=user_id, action="reset_password")
    reset_res = await async_client.post(
        "/api/v1/auth/reset-password",
        json={"token": reset_token, "new_password": new_password},
    )
    assert reset_res.status_code == 200
    assert "successfully" in reset_res.json()["message"].lower()

    # Verify old password fails
    login_old = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": old_password},
    )
    assert login_old.status_code == 401

    # Verify new password succeeds
    login_new = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password},
    )
    assert login_new.status_code == 200


@pytest.mark.asyncio
async def test_google_auth_flow(async_client: AsyncClient) -> None:
    google_sub = f"sub_{uuid.uuid4().hex[:8]}"
    email = f"google_{uuid.uuid4().hex[:8]}@example.com"
    mock_claims = {
        "sub": google_sub,
        "email": email,
        "name": "Google User",
        "picture": "https://example.com/avatar.jpg",
    }

    # Test Google signup
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_claims):
        res = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "valid-mock-token"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["email"] == email
        assert data["user"]["full_name"] == "Google User"
        assert data["user"]["is_verified"] is True
        assert "access_token" in data

    # Test Google signin for existing user
    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_claims):
        res2 = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "valid-mock-token"}
        )
        assert res2.status_code == 200
        assert res2.json()["user"]["email"] == email

    # Test invalid Google token
    with patch(
        "google.oauth2.id_token.verify_oauth2_token",
        side_effect=ValueError("Invalid Google token"),
    ):
        err_res = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "invalid-token"}
        )
        assert err_res.status_code == 400

    # Test Google token missing required claims (e.g. no email)
    with patch(
        "google.oauth2.id_token.verify_oauth2_token",
        return_value={"sub": "12345"},
    ):
        err_claims = await async_client.post(
            "/api/v1/auth/google", json={"id_token": "missing-claims"}
        )
        assert err_claims.status_code == 400


@pytest.mark.asyncio
async def test_auth_service_edge_cases(db_session: AsyncSession) -> None:
    from app.core.exceptions import (
        NotFoundException,
    )
    from app.repositories.token import RefreshTokenRepository
    from app.repositories.user import UserRepository
    from app.services.auth import AuthService
    from app.services.mail import MailService

    user_repo = UserRepository(db_session)
    token_repo = RefreshTokenRepository(db_session)
    mail_service = MailService()
    auth_service = AuthService(user_repo, token_repo, mail_service)

    # Logout by user_id
    user = await user_repo.create(
        email=f"edge_{uuid.uuid4().hex[:8]}@example.com",
        hashed_password="pwd",
        full_name="Edge User",
    )
    await auth_service.logout(None, user.id)

    # verify_email for non-existent user
    ghost_verify_token = create_action_token(
        subject=str(uuid.uuid4()), action="verify_email"
    )
    with pytest.raises(NotFoundException):
        await auth_service.verify_email(ghost_verify_token)

    # confirm_password_reset for non-existent user
    ghost_reset_token = create_action_token(
        subject=str(uuid.uuid4()), action="reset_password"
    )
    with pytest.raises(NotFoundException):
        await auth_service.confirm_password_reset(ghost_reset_token, "newpwd12345")
