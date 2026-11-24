from pathlib import Path
from urllib.parse import urlparse

import anyio.to_thread

from app.core.config import settings
from app.core.storage.base import BaseStorage


class LocalStorage(BaseStorage):
    def __init__(
        self,
        media_dir: str | Path | None = None,
        base_url: str | None = None,
    ) -> None:
        self.media_dir = Path(media_dir or settings.MEDIA_DIR)
        self.base_url = (base_url if base_url is not None else "/media").rstrip("/")

    async def save(
        self, file_bytes: bytes, filename: str, content_type: str = "image/webp"
    ) -> str:
        clean_path = Path(filename)
        if clean_path.is_absolute() or ".." in clean_path.parts:
            clean_path = Path(clean_path.name)
        target_path = self.media_dir / clean_path

        def _write() -> None:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(file_bytes)

        await anyio.to_thread.run_sync(_write)
        return f"{self.base_url}/{clean_path.as_posix()}"

    async def delete(self, file_url: str) -> None:
        if not file_url:
            return
        rel_path = file_url
        if "://" in rel_path:
            if "/media/" not in rel_path:
                return
            parsed = urlparse(rel_path)
            rel_path = parsed.path
        if self.base_url and rel_path.startswith(self.base_url):
            rel_path = rel_path.removeprefix(self.base_url)
        elif "/media/" in rel_path:
            rel_path = rel_path.split("/media/", 1)[1]
        rel_path = rel_path.lstrip("/")

        clean_path = Path(rel_path)
        if clean_path.is_absolute() or ".." in clean_path.parts:
            clean_path = Path(clean_path.name)
        target_path = self.media_dir / clean_path

        def _remove() -> None:
            if target_path.is_file():
                target_path.unlink()

        await anyio.to_thread.run_sync(_remove)
