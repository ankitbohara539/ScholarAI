from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from app.core.config import settings
from app.core.exceptions import BusinessRuleException

ALLOWED_IMAGE_FORMATS = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


class ProfileStorageService:
    def __init__(self, root: Path | None = None, max_bytes: int | None = None) -> None:
        self.root = (root or settings.avatar_upload_dir).resolve()
        self.max_bytes = max_bytes or settings.avatar_max_bytes

    def save(self, content: bytes, content_type: str | None) -> str:
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise BusinessRuleException("Avatar must be a JPEG, PNG, or WebP image")
        if not content or len(content) > self.max_bytes:
            raise BusinessRuleException(f"Avatar must be smaller than {self.max_bytes // (1024 * 1024)} MB")
        try:
            with Image.open(BytesIO(content)) as image:
                image.verify()
                extension = ALLOWED_IMAGE_FORMATS.get(image.format or "")
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise BusinessRuleException("Uploaded file is not a valid image") from exc
        if extension is None:
            raise BusinessRuleException("Avatar must be a JPEG, PNG, or WebP image")
        self.root.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4().hex}{extension}"
        (self.root / filename).write_bytes(content)
        return f"/media/avatars/{filename}"

    def delete(self, public_url: str | None) -> None:
        if not public_url or not public_url.startswith("/media/avatars/"):
            return
        filename = Path(public_url).name
        target = (self.root / filename).resolve()
        if target.parent == self.root:
            target.unlink(missing_ok=True)
