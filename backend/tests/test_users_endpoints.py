import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.user import UserRepository


async def _register(client: AsyncClient) -> tuple[str, dict[str, str]]:
    email = f"ep_{uuid.uuid4().hex[:8]}@example.com"
    r = await client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123"}
    )
    assert r.status_code == 201
    return r.json()["user"]["id"], {
        "Authorization": f"Bearer {r.json()['access_token']}"
    }


async def _make_admin(session: AsyncSession, user_id: str) -> None:
    repo = UserRepository(session)
    user = await repo.get_by_id(uuid.UUID(user_id))
    assert user is not None
    await repo.update(user, is_superuser=True)
    await session.commit()


@pytest.mark.asyncio
async def test_delete_me(async_client: AsyncClient) -> None:
    _, headers = await _register(async_client)

    r = await async_client.delete("/api/v1/users/me", headers=headers)
    assert r.status_code == 204

    # the account is gone, so the old access token no longer resolves a user
    r = await async_client.get("/api/v1/users/me", headers=headers)
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_admin_endpoints_require_superuser(async_client: AsyncClient) -> None:
    user_id, headers = await _register(async_client)

    assert (await async_client.get("/api/v1/users")).status_code == 401
    for method, url in [
        ("GET", "/api/v1/users"),
        ("POST", "/api/v1/users"),
        ("GET", f"/api/v1/users/{user_id}"),
        ("PATCH", f"/api/v1/users/{user_id}"),
        ("DELETE", f"/api/v1/users/{user_id}"),
    ]:
        r = await async_client.request(method, url, headers=headers, json={})
        assert r.status_code == 403, (method, url)


@pytest.mark.asyncio
async def test_admin_crud(async_client: AsyncClient, db_session: AsyncSession) -> None:
    admin_id, admin = await _register(async_client)
    await _make_admin(db_session, admin_id)

    email = f"ep_new_{uuid.uuid4().hex[:8]}@example.com"
    created = await async_client.post(
        "/api/v1/users",
        headers=admin,
        json={"email": email, "password": "password123", "full_name": "New"},
    )
    assert created.status_code == 201
    user_id = created.json()["id"]
    assert "hashed_password" not in created.json()

    dup = await async_client.post(
        "/api/v1/users", headers=admin, json={"email": email, "password": "password123"}
    )
    assert dup.status_code == 409

    got = await async_client.get(f"/api/v1/users/{user_id}", headers=admin)
    assert got.status_code == 200
    assert got.json()["email"] == email

    patched = await async_client.patch(
        f"/api/v1/users/{user_id}", headers=admin, json={"city": "Lviv"}
    )
    assert patched.status_code == 200
    assert patched.json()["city"] == "Lviv"

    listed = await async_client.get(
        "/api/v1/users", headers=admin, params={"limit": 100}
    )
    assert listed.status_code == 200
    assert isinstance(listed.json(), list)

    bad_limit = await async_client.get(
        "/api/v1/users", headers=admin, params={"limit": 0}
    )
    assert bad_limit.status_code == 422

    deleted = await async_client.delete(f"/api/v1/users/{user_id}", headers=admin)
    assert deleted.status_code == 204
    gone = await async_client.get(f"/api/v1/users/{user_id}", headers=admin)
    assert gone.status_code == 404

    missing = await async_client.get(f"/api/v1/users/{uuid.uuid4()}", headers=admin)
    assert missing.status_code == 404
    bad_id = await async_client.get("/api/v1/users/not-a-uuid", headers=admin)
    assert bad_id.status_code == 422


@pytest.mark.asyncio
async def test_change_password(async_client: AsyncClient) -> None:
    email = f"pwd_{uuid.uuid4().hex[:8]}@example.com"
    reg = await async_client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}
    refresh = reg.json()["refresh_token"]
    url = "/api/v1/users/me/password"

    no_auth = await async_client.post(
        url, json={"current_password": "password123", "new_password": "newpass123"}
    )
    assert no_auth.status_code == 401

    wrong = await async_client.post(
        url,
        headers=headers,
        json={"current_password": "wrong-pass", "new_password": "newpass123"},
    )
    assert wrong.status_code == 400

    too_short = await async_client.post(
        url,
        headers=headers,
        json={"current_password": "password123", "new_password": "short"},
    )
    assert too_short.status_code == 422

    ok = await async_client.post(
        url,
        headers=headers,
        json={"current_password": "password123", "new_password": "newpass123"},
    )
    assert ok.status_code == 200

    login = "/api/v1/auth/login"
    old = await async_client.post(
        login, json={"email": email, "password": "password123"}
    )
    assert old.status_code == 401
    new = await async_client.post(
        login, json={"email": email, "password": "newpass123"}
    )
    assert new.status_code == 200

    # every existing session was signed out
    r = await async_client.post("/api/v1/auth/refresh", json={"refresh_token": refresh})
    assert r.status_code == 401
