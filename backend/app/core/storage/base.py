from abc import ABC, abstractmethod


class BaseStorage(ABC):
    @abstractmethod
    async def save(
        self, file_bytes: bytes, filename: str, content_type: str = "image/webp"
    ) -> str:
        """Saves file bytes and returns accessible URL."""

    @abstractmethod
    async def delete(self, file_url: str) -> None:
        """Deletes file by URL if supported."""
