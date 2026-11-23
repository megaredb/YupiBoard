from contextvars import ContextVar
from urllib.parse import urlparse

from fastapi import Request

from app.core.config import settings

request_origin_var: ContextVar[str | None] = ContextVar("request_origin", default=None)


def extract_request_origin(request: Request) -> str:
    """Resolve the client-facing origin (including port, e.g. :8443 for Android)."""
    proto = (
        request.headers.get("x-forwarded-proto", "").split(",")[0].strip()
        or request.url.scheme
        or "https"
    )
    host = (
        request.headers.get("x-forwarded-host", "").split(",")[0].strip()
        or request.headers.get("host", "").strip()
        or request.url.netloc
    )
    return f"{proto}://{host}" if host else ""


def _fallback_origin() -> str:
    parsed = urlparse(settings.MEDIA_BASE_URL.rstrip("/"))
    if parsed.scheme and parsed.netloc:
        return f"{parsed.scheme}://{parsed.netloc}"
    return ""


def _media_prefix() -> str:
    return settings.MEDIA_BASE_URL.rstrip("/")


def resolve_media_url(url: str | None) -> str | None:
    """Resolve local `/media/...` paths (and legacy MEDIA_BASE_URL URLs) against the
    active request origin so web and Android (:8443) receive reachable URLs."""
    if not url:
        return url

    origin = request_origin_var.get() or _fallback_origin()
    if url.startswith("/media/"):
        return f"{origin.rstrip('/')}{url}" if origin else url

    prefix = _media_prefix()
    if prefix and url.startswith(f"{prefix}/"):
        relative = url[len(prefix) :]
        if not relative.startswith("/media/"):
            relative = f"/media{relative}"
        return f"{origin.rstrip('/')}{relative}" if origin else relative

    return url


def normalize_stored_media_url(url: str | None) -> str | None:
    """Normalize local media URLs to relative `/media/...` paths before persistence."""
    if not url or settings.STORAGE_BACKEND.lower() != "local":
        return url

    if url.startswith("/media/"):
        return url

    parsed = urlparse(url)
    hostname = parsed.hostname or ""
    if parsed.path.startswith("/media/") and (
        url.startswith(f"{_media_prefix()}/")
        or (
            request_origin_var.get()
            and url.startswith(f"{request_origin_var.get()}/media/")
        )
        or hostname == "yupiboard.localhost"
        or hostname.endswith(".yupiboard.localhost")
    ):
        return parsed.path

    return url
