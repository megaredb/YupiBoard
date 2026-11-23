import pytest
from httpx import AsyncClient

from app.core.media_url import (
    normalize_stored_media_url,
    request_origin_var,
    resolve_media_url,
)


def test_resolve_media_url_respects_request_origin_and_port() -> None:
    assert resolve_media_url(None) is None
    assert (
        resolve_media_url("https://lh3.googleusercontent.com/a/photo.jpg")
        == "https://lh3.googleusercontent.com/a/photo.jpg"
    )

    token = request_origin_var.set("https://api.yupiboard.localhost:8443")
    try:
        assert (
            resolve_media_url("/media/avatars/u1.webp")
            == "https://api.yupiboard.localhost:8443/media/avatars/u1.webp"
        )
        assert (
            resolve_media_url("https://api.yupiboard.localhost/media/events/e1.webp")
            == "https://api.yupiboard.localhost:8443/media/events/e1.webp"
        )
    finally:
        request_origin_var.reset(token)


def test_normalize_stored_media_url_strips_local_origin() -> None:
    assert (
        normalize_stored_media_url(
            "https://api.yupiboard.localhost:8443/media/avatars/u1.webp"
        )
        == "/media/avatars/u1.webp"
    )
    assert (
        normalize_stored_media_url(
            "https://api.yupiboard.localhost/media/events/e1.webp"
        )
        == "/media/events/e1.webp"
    )
    assert (
        normalize_stored_media_url("https://storage.yupiboard.com/media/events/e1.webp")
        == "https://storage.yupiboard.com/media/events/e1.webp"
    )


@pytest.mark.asyncio
async def test_android_forwarded_host_port_rewrites_media_urls_in_api(
    async_client: AsyncClient, create_mock_user
) -> None:
    _, token = await create_mock_user(avatar_url="/media/avatars/android-test.webp")
    res = await async_client.get(
        "/api/v1/users/me",
        headers={
            "Authorization": f"Bearer {token}",
            "X-Forwarded-Proto": "https",
            "X-Forwarded-Host": "api.yupiboard.localhost:8443",
        },
    )
    assert res.status_code == 200
    assert (
        res.json()["avatar_url"]
        == "https://api.yupiboard.localhost:8443/media/avatars/android-test.webp"
    )
