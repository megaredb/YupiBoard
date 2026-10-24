import uuid

import pytest
from httpx import AsyncClient

from app.api.deps import (
    get_current_superuser,
    get_current_verified_user,
    get_token_from_request,
)
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.security import create_access_token
from app.models.user import User


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

    # Authorized PATCH; password is not a profile field and is ignored here
    r_patch = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"full_name": "Brand New Name", "password": "brandnewpassword999"},
    )
    assert r_patch.status_code == 200
    assert r_patch.json()["full_name"] == "Brand New Name"

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
async def test_profile_fields_and_read_only_ratings(async_client: AsyncClient) -> None:
    email = f"profile_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "password123"},
    )
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    me = (await async_client.get("/api/v1/users/me", headers=headers)).json()
    assert me["city"] is None
    assert me["contact_info"] is None
    assert me["rating_as_player"] == 5.0
    assert me["rating_as_organizer"] == 5.0
    assert "is_deleted" not in me

    patched = await async_client.patch(
        "/api/v1/users/me",
        headers=headers,
        json={
            "city": "Kyiv",
            "contact_info": "@yupi",
            "rating_as_player": 1,
        },
    )
    assert patched.status_code == 200
    body = patched.json()
    assert body["city"] == "Kyiv"
    assert body["contact_info"] == "@yupi"
    assert body["rating_as_player"] == 5.0

    too_long = await async_client.patch(
        "/api/v1/users/me", headers=headers, json={"city": "x" * 101}
    )
    assert too_long.status_code == 422
