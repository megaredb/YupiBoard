import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_endpoints_require_superuser(
    async_client: AsyncClient, create_mock_user
) -> None:
    user, user_token = await create_mock_user(is_superuser=False)
    headers = {"Authorization": f"Bearer {user_token}"}
    routes = [
        ("GET", "/api/v1/users"),
        ("PATCH", f"/api/v1/users/{user.id}"),
        ("DELETE", f"/api/v1/users/{user.id}"),
    ]
    for method, url in routes:
        r = await async_client.request(method, url, json={})
        assert r.status_code == 401, (method, url)
        r = await async_client.request(method, url, headers=headers, json={})
        assert r.status_code == 403, (method, url)


@pytest.mark.asyncio
async def test_admin_user_management(
    async_client: AsyncClient, create_mock_user
) -> None:
    _admin, admin_token = await create_mock_user(is_superuser=True)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    target_user, _ = await create_mock_user(first_name="Target", last_name="User")

    got = await async_client.get(
        f"/api/v1/users/{target_user.id}", headers=admin_headers
    )
    assert got.status_code == 200
    assert got.json()["id"] == str(target_user.id)
    assert got.json()["first_name"] == "Target"
    assert got.json()["last_name"] == "User"

    patched = await async_client.patch(
        f"/api/v1/users/{target_user.id}",
        headers=admin_headers,
        json={"city": "Lviv", "first_name": "UpdatedTarget"},
    )
    assert patched.status_code == 200
    assert patched.json()["city"] == "Lviv"
    assert patched.json()["first_name"] == "UpdatedTarget"

    listed = await async_client.get(
        "/api/v1/users", headers=admin_headers, params={"limit": 100}
    )
    assert listed.status_code == 200
    assert isinstance(listed.json(), list)

    deleted = await async_client.delete(
        f"/api/v1/users/{target_user.id}", headers=admin_headers
    )
    assert deleted.status_code == 204
    gone = await async_client.get(
        f"/api/v1/users/{target_user.id}", headers=admin_headers
    )
    assert gone.status_code == 404


@pytest.mark.asyncio
async def test_admin_endpoints_validation(
    async_client: AsyncClient, create_mock_user
) -> None:
    _admin, admin_token = await create_mock_user(is_superuser=True)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Missing UUIDv7 returns 404
    missing_uuid7 = uuid.uuid7()
    missing = await async_client.get(
        f"/api/v1/users/{missing_uuid7}", headers=admin_headers
    )
    assert missing.status_code == 404

    # UUIDv4 is rejected by UUID7 validation with 422
    uuid4_id = uuid.uuid4()
    bad_version = await async_client.get(
        f"/api/v1/users/{uuid4_id}", headers=admin_headers
    )
    assert bad_version.status_code == 422

    # Malformed non-UUID is rejected with 422
    bad_id = await async_client.get("/api/v1/users/not-a-uuid", headers=admin_headers)
    assert bad_id.status_code == 422

    # Pagination validation
    for params in ({"limit": 0}, {"limit": 101}, {"skip": -1}):
        r = await async_client.get(
            "/api/v1/users", headers=admin_headers, params=params
        )
        assert r.status_code == 422, params
