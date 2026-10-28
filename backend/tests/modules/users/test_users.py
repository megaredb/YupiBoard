import uuid

import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.modules.users.enums import UserStatus


@pytest.mark.asyncio
async def test_get_current_user_profile(
    async_client: AsyncClient, create_mock_user
) -> None:
    # Unauthorized
    r_unauth = await async_client.get("/api/v1/users/me")
    assert r_unauth.status_code == 401

    # Mock user
    user, token = await create_mock_user(first_name="Alexander", last_name="Dovzhenko")

    # Authorized via Bearer header
    r_auth = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r_auth.status_code == 200
    data = r_auth.json()
    assert data["id"] == str(user.id)
    assert data["email"] == user.email
    assert data["first_name"] == "Alexander"
    assert data["last_name"] == "Dovzhenko"
    assert data["status"] == "Active"
    assert data["rating_as_player"] is None
    assert data["rating_as_organizer"] is None

    # Authorized via Cookie
    r_cookie = await async_client.get(
        "/api/v1/users/me",
        cookies={"access_token": token},
    )
    assert r_cookie.status_code == 200
    assert r_cookie.json()["id"] == str(user.id)


@pytest.mark.asyncio
async def test_update_current_user_profile(
    async_client: AsyncClient, create_mock_user
) -> None:
    user, token = await create_mock_user(first_name="Old", last_name="Name")

    # Unauthorized PATCH
    r_unauth = await async_client.patch(
        "/api/v1/users/me",
        json={"first_name": "Hacker"},
    )
    assert r_unauth.status_code == 401

    # Authorized PATCH updating profile fields
    r_patch = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "first_name": "NewFirst",
            "last_name": "NewLast",
            "city": "Kyiv",
            "contact_info": "@yupi",
        },
    )
    assert r_patch.status_code == 200
    body = r_patch.json()
    assert body["first_name"] == "NewFirst"
    assert body["last_name"] == "NewLast"
    assert body["city"] == "Kyiv"
    assert body["contact_info"] == "@yupi"

    # Explicit null on city clears it, contact_info stays untouched
    r_clear = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"city": None},
    )
    assert r_clear.status_code == 200
    assert r_clear.json()["city"] is None
    assert r_clear.json()["contact_info"] == "@yupi"

    # Explicit null on first_name/last_name is rejected
    r_null_name = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": None},
    )
    assert r_null_name.status_code == 422

    # Validation: length boundaries
    r_too_short = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": "A"},
    )
    assert r_too_short.status_code == 422

    r_too_long = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"first_name": "A" * 51},
    )
    assert r_too_long.status_code == 422

    # Credentials/email in PATCH are ignored
    r_creds = await async_client.patch(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"password": "brandnewpassword999", "email": "other@example.com"},
    )
    assert r_creds.status_code == 200
    assert r_creds.json()["email"] == user.email


@pytest.mark.asyncio
async def test_new_user_has_no_ratings(
    async_client: AsyncClient, create_mock_user
) -> None:
    _, token = await create_mock_user()
    r = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    res = r.json()
    assert res["rating_as_player"] is None
    assert res["rating_as_organizer"] is None
    assert res["status"] == "Active"


@pytest.mark.asyncio
async def test_delete_me_soft_deletes_account(
    async_client: AsyncClient, create_mock_user
) -> None:
    _, token = await create_mock_user()
    headers = {"Authorization": f"Bearer {token}"}

    assert (await async_client.delete("/api/v1/users/me")).status_code == 401

    r_delete = await async_client.delete("/api/v1/users/me", headers=headers)
    assert r_delete.status_code == 204

    # The deleted account returns 401 Unauthorized
    r_me = await async_client.get("/api/v1/users/me", headers=headers)
    assert r_me.status_code == 401


@pytest.mark.asyncio
async def test_banned_user_is_forbidden(
    async_client: AsyncClient, create_mock_user
) -> None:
    _, token = await create_mock_user(status=UserStatus.BANNED)
    r = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 403


@pytest.mark.asyncio
async def test_ghost_token_returns_401(async_client: AsyncClient) -> None:
    ghost_token = create_access_token(str(uuid.uuid7()))
    r = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {ghost_token}"},
    )
    assert r.status_code == 401
