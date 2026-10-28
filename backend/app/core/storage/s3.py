from pathlib import Path

from app.core.config import settings
from app.core.storage.base import BaseStorage


class S3Storage(BaseStorage):
    def __init__(
        self,
        bucket_name: str | None = None,
        endpoint_url: str | None = None,
        public_url_prefix: str | None = None,
    ) -> None:
        self.bucket_name = bucket_name or settings.S3_BUCKET_NAME
        self.endpoint_url = endpoint_url or settings.S3_ENDPOINT_URL
        self.public_url_prefix = (
            public_url_prefix or settings.S3_PUBLIC_URL_PREFIX
        ).rstrip("/")

    async def save(
        self, file_bytes: bytes, filename: str, content_type: str = "image/webp"
    ) -> str:
        clean_filename = Path(filename).name
        # S3 / R2 upload implementation hook (e.g. using aiobotocore / boto3)
        # Returns public CDN/S3 URL
        return f"{self.public_url_prefix}/{clean_filename}"

    async def delete(self, file_url: str) -> None:
        pass
