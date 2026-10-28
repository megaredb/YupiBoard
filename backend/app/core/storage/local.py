from pathlib import Path

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
        self.base_url = (base_url or settings.MEDIA_BASE_URL).rstrip("/")

    async def save(
        self, file_bytes: bytes, filename: str, content_type: str = "image/webp"
    ) -> str:
        clean_filename = Path(filename).name
        target_path = self.media_dir / clean_filename

        def _write() -> None:
            target_path.parent.mkdir(parents=True, exist_ok=True)
            target_path.write_bytes(file_bytes)

        await anyio.to_thread.run_sync(_write)
        return f"{self.base_url}/{clean_filename}"

    async def delete(self, file_url: str) -> None:
        filename = Path(file_url).name
        target_path = self.media_dir / filename

        def _remove() -> None:
            if target_path.exists():
                target_path.unlink()

        await anyio.to_thread.run_sync(_remove)
