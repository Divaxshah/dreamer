"""Stub platform base — messaging adapters removed."""

from pathlib import Path

GATEWAY_SECRET_CAPTURE_UNSUPPORTED_MESSAGE = (
    "Secret capture is unavailable — messaging gateway was removed."
)


def get_image_cache_dir() -> Path:
    from hermes_constants import get_hermes_home
    path = get_hermes_home() / "cache" / "images"
    path.mkdir(parents=True, exist_ok=True)
    return path


def cache_image_from_bytes(data: bytes, *, suffix: str = ".png") -> str:
    import uuid
    cache_dir = get_image_cache_dir()
    path = cache_dir / f"{uuid.uuid4().hex}{suffix}"
    path.write_bytes(data)
    return str(path)
