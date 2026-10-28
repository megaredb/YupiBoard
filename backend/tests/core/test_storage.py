import io
from pathlib import Path

import pytest
from PIL import Image

from app.core.exceptions import BadRequestException
from app.core.storage.image import (
    MAX_AVATAR_SIZE_BYTES,
    process_avatar_image,
)
from app.core.storage.local import LocalStorage
from app.main import app


def create_test_image(
    format: str = "PNG", size: tuple[int, int] = (100, 100), color: str = "red"
) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=color)
    img.save(buf, format=format)
    return buf.getvalue()


def test_process_avatar_image_valid_png() -> None:
    data = create_test_image("PNG", (200, 200))
    processed, content_type, ext = process_avatar_image(data)

    assert content_type == "image/webp"
    assert ext == "webp"
    assert len(processed) > 0

    with Image.open(io.BytesIO(processed)) as img:
        assert img.size == (200, 200)


def test_process_avatar_image_valid_webp() -> None:
    data = create_test_image("WEBP", (300, 300))
    processed, content_type, ext = process_avatar_image(data)

    assert content_type == "image/webp"
    assert ext == "webp"
    assert len(processed) > 0

    with Image.open(io.BytesIO(processed)) as img:
        assert img.size == (300, 300)


def test_process_avatar_image_resizes_large_dimensions() -> None:
    data = create_test_image("JPEG", (1200, 800))
    processed, _, _ = process_avatar_image(data)

    with Image.open(io.BytesIO(processed)) as img:
        assert max(img.size) <= 512


def test_process_avatar_image_rejects_oversized_payload() -> None:
    large_payload = b"X" * (MAX_AVATAR_SIZE_BYTES + 1)
    with pytest.raises(BadRequestException, match="exceeds maximum limit"):
        process_avatar_image(large_payload)


def test_process_avatar_image_rejects_corrupted_or_non_image() -> None:
    with pytest.raises(
        BadRequestException, match="Unsupported media type|Invalid or corrupted"
    ):
        process_avatar_image(b"fake image payload without magic bytes")


@pytest.mark.asyncio
async def test_local_storage_lifecycle(tmp_path: Path) -> None:
    storage = LocalStorage(media_dir=tmp_path, base_url="/media")

    url = await storage.save(b"test-bytes", "avatar.webp")
    assert url == "/media/avatar.webp"
    assert (tmp_path / "avatar.webp").read_bytes() == b"test-bytes"

    await storage.delete(url)
    assert not (tmp_path / "avatar.webp").exists()

    nested_url = await storage.save(b"nested-bytes", "avatars/sub/avatar.webp")
    assert nested_url == "/media/avatars/sub/avatar.webp"
    assert (
        tmp_path / "avatars" / "sub" / "avatar.webp"
    ).read_bytes() == b"nested-bytes"

    await storage.delete(nested_url)
    assert not (tmp_path / "avatars" / "sub" / "avatar.webp").exists()


def test_avatar_upload_route_is_registered() -> None:
    paths = app.openapi()["paths"]
    assert "/api/v1/users/me/avatar" in paths
    assert "post" in paths["/api/v1/users/me/avatar"]
