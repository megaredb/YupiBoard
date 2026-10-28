from app.core.config import settings
from app.core.storage.base import BaseStorage
from app.core.storage.image import process_avatar_image
from app.core.storage.local import LocalStorage
from app.core.storage.s3 import S3Storage


def get_storage() -> BaseStorage:
    if settings.STORAGE_BACKEND.lower() == "s3":
        return S3Storage()
    return LocalStorage()


__all__ = [
    "BaseStorage",
    "LocalStorage",
    "S3Storage",
    "get_storage",
    "process_avatar_image",
]
