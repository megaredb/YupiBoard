import uuid
from typing import Annotated

from fastapi import Depends, UploadFile

from app.core.config import settings
from app.core.storage.base import BaseStorage
from app.core.storage.image import process_avatar_image, process_event_image
from app.core.storage.local import LocalStorage
from app.core.storage.s3 import S3Storage


def get_storage() -> BaseStorage:
    if settings.STORAGE_BACKEND.lower() == "s3":
        return S3Storage()
    return LocalStorage()


class MediaService:
    def __init__(self, storage: BaseStorage) -> None:
        self.storage = storage

    async def upload_avatar(self, file: UploadFile, user_id: uuid.UUID) -> str:
        file_bytes = await file.read()
        processed_bytes, content_type, ext = process_avatar_image(file_bytes)
        filename = f"avatars/{user_id}_{uuid.uuid7().hex}.{ext}"
        return await self.storage.save(
            processed_bytes, filename=filename, content_type=content_type
        )

    async def upload_event_image(
        self, file: UploadFile, organizer_id: uuid.UUID
    ) -> str:
        file_bytes = await file.read()
        processed_bytes, content_type, ext = process_event_image(file_bytes)
        filename = f"events/{organizer_id}_{uuid.uuid7().hex}.{ext}"
        return await self.storage.save(
            processed_bytes, filename=filename, content_type=content_type
        )


def get_media_service(
    storage: Annotated[BaseStorage, Depends(get_storage)],
) -> MediaService:
    return MediaService(storage=storage)
