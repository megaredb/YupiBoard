import uuid

import pytest
from httpx import AsyncClient

from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import create_access_token
from app.modules.auth.dependencies import (
    get_current_superuser,
    get_current_verified_user,
    get_token_from_request,
)
from app.modules.users.models import User


@pytest.mark.asyncio
async def test_get_current_user_profile(async_client: AsyncClient) -> None:
    # Unauthorized
    r_unauth = await async_client.get("/api/v1/users/me")
    assert r_unauth.status_code == 401

    # Register user
    email = f"user_me_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Me User"},
    )
    token = reg.json()["access_token"]

    # Authorized via Bearer header
    r_auth = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_auth.status_code == 200
    assert r_auth.json()["email"] == email

    # Authorized via Cookie
    r_cookie = await async_client.get(
        "/api/v1/users/me",
        cookies={"access_token": token},
    )
    assert r_cookie.status_code == 200
    assert r_cookie.json()["email"] == email


@pytest.mark.asyncio
async def test_update_current_user_profile(async_client: AsyncClient) -> None:
    email = f"update_me_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123", "full_name": "Initial Name"},
    )
    token = reg.json()["access_token"]

    # Unauthorized PATCH
    r_unauth = await async_client.patch(
        "/api/v1/users/me",
        json={"full_name": "Hacker Name"},
    )
    assert r_unauth.status_code == 401

    # Authorized PATCH updating profile fields
    r_patch = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Brand New Name", "city": "Kyiv", "contact_info": "@yupi"},
    )
    assert r_patch.status_code == 200
    body = r_patch.json()
    assert body["full_name"] == "Brand New Name"
    assert body["city"] == "Kyiv"
    assert body["contact_info"] == "@yupi"

    # Credentials are not profile fields: password/email in PATCH are ignored
    r_creds = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"password": "brandnewpassword999", "email": "other@example.com"},
    )
    assert r_creds.status_code == 200
    assert r_creds.json()["email"] == email

    r_login_new = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "brandnewpassword999"},
    )
    assert r_login_new.status_code == 401
    r_login_old = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert r_login_old.status_code == 200

    # Explicit null clears a field, omitted fields stay untouched
    r_clear = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": None},
    )
    assert r_clear.status_code == 200
    assert r_clear.json()["city"] is None
    assert r_clear.json()["contact_info"] == "@yupi"

    # Validation of new profile fields
    r_long = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": "x" * 101},
    )
    assert r_long.status_code == 422


@pytest.mark.asyncio
async def test_user_dependencies_role_checks() -> None:
    # Test get_token_from_request with neither header nor cookie
    with pytest.raises(UnauthorizedException):
        await get_token_from_request(None, None)

    # Test get_token_from_request with non-bearer header
    with pytest.raises(UnauthorizedException):
        await get_token_from_request("Basic 12345", None)

    # Test get_current_verified_user
    unverified_user = User(
        id=uuid.uuid4(),
        email="unverified@example.com",
        is_active=True,
        is_verified=False,
    )
    with pytest.raises(ForbiddenException):
        await get_current_verified_user(unverified_user)

    verified_user = User(
        id=uuid.uuid4(),
        email="verified@example.com",
        is_active=True,
        is_verified=True,
    )
    assert await get_current_verified_user(verified_user) == verified_user

    # Test get_current_superuser
    regular_user = User(
        id=uuid.uuid4(),
        email="regular@example.com",
        is_active=True,
        is_superuser=False,
    )
    with pytest.raises(ForbiddenException):
        await get_current_superuser(regular_user)

    superuser = User(
        id=uuid.uuid4(),
        email="admin@example.com",
        is_active=True,
        is_superuser=True,
    )
    assert await get_current_superuser(superuser) == superuser


@pytest.mark.asyncio
async def test_invalid_tokens_in_get_current_user(async_client: AsyncClient) -> None:
    # Token with missing 'sub'
    no_sub_token = create_access_token(subject="")
    r1 = await async_client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {no_sub_token}"}
    )
    assert r1.status_code == 401

    # Token with invalid UUID
    bad_uuid_token = create_access_token(subject="not-a-valid-uuid")
    r2 = await async_client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {bad_uuid_token}"}
    )
    assert r2.status_code == 401

    # Token with non-existent user UUID
    non_existent_uuid = str(uuid.uuid4())
    ghost_token = create_access_token(subject=non_existent_uuid)
    r3 = await async_client.get(
        "/api/v1/users/me", headers={"Authorization": f"Bearer {ghost_token}"}
    )
    assert r3.status_code == 404


@pytest.mark.asyncio
async def test_new_user_has_no_ratings(async_client: AsyncClient) -> None:
    email = f"ratings_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    assert reg.status_code == 201
    user = reg.json()["user"]
    assert user["rating_as_player"] is None
    assert user["rating_as_organizer"] is None
    assert user["city"] is None
    assert user["contact_info"] is None
    assert "is_deleted" not in user


@pytest.mark.asyncio
async def test_delete_me_frees_email_for_new_registration(
    async_client: AsyncClient,
) -> None:
    email = f"delete_me_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    old_id = reg.json()["user"]["id"]
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    assert (await async_client.delete("/api/v1/users/me")).status_code == 401

    r_delete = await async_client.delete("/api/v1/users/me", headers=headers)
    assert r_delete.status_code == 204

    # the deleted account no longer resolves
    r_me = await async_client.get("/api/v1/users/me", headers=headers)
    assert r_me.status_code == 404

    r_login = await async_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123"},
    )
    assert r_login.status_code == 401

    # the same email can register a brand-new account
    r_reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "newpassword123"},
    )
    assert r_reg.status_code == 201
    assert r_reg.json()["user"]["id"] != old_id
