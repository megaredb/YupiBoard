import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(async_client: AsyncClient) -> None:
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "connected")
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_register_and_login_flow(async_client: AsyncClient) -> None:
    test_email = f"user_{uuid.uuid4().hex[:8]}@example.com"
    password = "strongpassword123"

    # Register
    reg_response = await async_client.post(
        "/api/v1/auth/register",
        json={
            "email": test_email,
            "password": password,
            "full_name": "Test User",
        },
    )
    assert reg_response.status_code == 201
    reg_data = reg_response.json()
    assert reg_data["user"]["email"] == test_email
    assert "access_token" in reg_data

    # Login
    login_response = await async_client.post(
        "/api/v1/auth/login",
        json={
            "email": test_email,
            "password": password,
        },
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["user"]["email"] == test_email

    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")

    # Test authenticated /me
    me_response = await async_client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == test_email

    # Test token refresh
    refresh_response = await async_client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_response.status_code == 200
    new_token_data = refresh_response.json()
    assert "access_token" in new_token_data

    # Test logout
    logout_response = await async_client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_token_data.get("refresh_token")},
    )
    assert logout_response.status_code == 200
