import io

from PIL import Image, ImageOps

from app.core.exceptions import BadRequestException

MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024  # 2 MB
MAX_AVATAR_DIMENSION = 512

MAX_EVENT_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_EVENT_IMAGE_WIDTH = 1920
MAX_EVENT_IMAGE_HEIGHT = 1080

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}


def process_image(
    file_bytes: bytes,
    *,
    max_size_bytes: int,
    max_dimension: tuple[int, int],
    quality: int = 85,
) -> tuple[bytes, str, str]:
    if not file_bytes:
        raise BadRequestException("Empty file payload")

    if len(file_bytes) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise BadRequestException(f"File payload exceeds maximum limit of {max_mb} MB")

    try:
        # Inspect magic bytes and verify integrity
        with Image.open(io.BytesIO(file_bytes)) as img:
            image_format = img.format
            if not image_format or image_format.upper() not in ALLOWED_IMAGE_FORMATS:
                raise BadRequestException(
                    "Unsupported media type. Only JPEG, PNG, and WebP formats are permitted."
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

            # Resize keeping aspect ratio within max_dimension
            oriented_img.thumbnail(
                max_dimension,
                Image.Resampling.LANCZOS,
            )

            out_buffer = io.BytesIO()
            oriented_img.save(out_buffer, format="WEBP", quality=quality, method=6)
            return out_buffer.getvalue(), "image/webp", "webp"
    except BadRequestException:
        raise
    except Exception as exc:
        raise BadRequestException("Invalid or corrupted image payload") from exc


def process_avatar_image(file_bytes: bytes) -> tuple[bytes, str, str]:
    return process_image(
        file_bytes,
        max_size_bytes=MAX_AVATAR_SIZE_BYTES,
        max_dimension=(MAX_AVATAR_DIMENSION, MAX_AVATAR_DIMENSION),
    )


def process_event_image(file_bytes: bytes) -> tuple[bytes, str, str]:
    return process_image(
        file_bytes,
        max_size_bytes=MAX_EVENT_IMAGE_SIZE_BYTES,
        max_dimension=(MAX_EVENT_IMAGE_WIDTH, MAX_EVENT_IMAGE_HEIGHT),
    )
