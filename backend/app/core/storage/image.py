import io

from PIL import Image, ImageOps

from app.core.exceptions import BadRequestException

MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_THUMBNAIL_DIMENSION = 512
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}


def process_avatar_image(file_bytes: bytes) -> tuple[bytes, str, str]:
    if not file_bytes:
        raise BadRequestException("Empty file payload")

    if len(file_bytes) > MAX_AVATAR_SIZE_BYTES:
        raise BadRequestException("File payload exceeds maximum limit of 2 MB")

    try:
        # Inspect magic bytes and verify integrity
        with Image.open(io.BytesIO(file_bytes)) as img:
            image_format = img.format
            if not image_format or image_format.upper() not in ALLOWED_IMAGE_FORMATS:
                raise BadRequestException(
                    "Unsupported media type. Only JPEG and PNG formats are permitted."
                )

            # Auto-orient based on EXIF before stripping metadata
            oriented_img = ImageOps.exif_transpose(img) or img
            # Convert RGBA to RGB with white background if saving to WebP/JPEG
            if oriented_img.mode in ("RGBA", "LA", "P"):
                rgba_img = oriented_img.convert("RGBA")
                background = Image.new("RGBA", rgba_img.size, (255, 255, 255, 255))
                oriented_img = Image.alpha_composite(background, rgba_img).convert(
                    "RGB"
                )
            elif oriented_img.mode != "RGB":
                oriented_img = oriented_img.convert("RGB")

            # Resize to max 512x512 px thumbnail keeping aspect ratio
            oriented_img.thumbnail(
                (MAX_THUMBNAIL_DIMENSION, MAX_THUMBNAIL_DIMENSION),
                Image.Resampling.LANCZOS,
            )

            out_buffer = io.BytesIO()
            oriented_img.save(out_buffer, format="WEBP", quality=85, method=6)
            return out_buffer.getvalue(), "image/webp", "webp"
    except BadRequestException:
        raise
    except Exception as exc:
        raise BadRequestException("Invalid or corrupted image payload") from exc
