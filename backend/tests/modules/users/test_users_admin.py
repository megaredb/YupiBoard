import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.users.repository import UserRepository


async def _register(client: AsyncClient) -> tuple[str, dict[str, str]]:
    email = f"admin_ep_{uuid.uuid4().hex[:8]}@example.com"
    r = await client.post(
        "/api/v1/auth/register", json={"email": email, "password": "password123"}
    )
    assert r.status_code == 201
    headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
    return r.json()["user"]["id"], headers


async def _make_admin(session: AsyncSession, user_id: str) -> None:
    repo = UserRepository(session)
    user = await repo.get_by_id(uuid.UUID(user_id))
    assert user is not None
    await repo.update(user, is_superuser=True)
    await session.commit()


@pytest.mark.asyncio
async def test_admin_endpoints_require_superuser(async_client: AsyncClient) -> None:
    user_id, headers = await _register(async_client)
    routes = [
        ("GET", "/api/v1/users"),
        ("GET", f"/api/v1/users/{user_id}"),
        ("PATCH", f"/api/v1/users/{user_id}"),
        ("DELETE", f"/api/v1/users/{user_id}"),
    ]
    for method, url in routes:
        r = await async_client.request(method, url, json={})
        assert r.status_code == 401, (method, url)
        r = await async_client.request(method, url, headers=headers, json={})
        assert r.status_code == 403, (method, url)


@pytest.mark.asyncio
async def test_admin_user_management(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    admin_id, admin = await _register(async_client)
    await _make_admin(db_session, admin_id)
    user_id, _ = await _register(async_client)

    got = await async_client.get(f"/api/v1/users/{user_id}", headers=admin)
    assert got.status_code == 200
    assert got.json()["id"] == user_id

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

    deleted = await async_client.delete(f"/api/v1/users/{user_id}", headers=admin)
    assert deleted.status_code == 204
    gone = await async_client.get(f"/api/v1/users/{user_id}", headers=admin)
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_admin_endpoints_validation(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    admin_id, admin = await _register(async_client)
    await _make_admin(db_session, admin_id)

    missing = await async_client.get(f"/api/v1/users/{uuid.uuid4()}", headers=admin)
    assert missing.status_code == 404
    bad_id = await async_client.get("/api/v1/users/not-a-uuid", headers=admin)
    assert bad_id.status_code == 422
    for params in ({"limit": 0}, {"limit": 101}, {"skip": -1}):
        r = await async_client.get("/api/v1/users", headers=admin, params=params)
        assert r.status_code == 422, params
