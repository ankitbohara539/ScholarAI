from collections.abc import Sequence
from datetime import datetime, timezone

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationType


class NotificationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, *, user_id: int, type: NotificationType, title: str, message: str) -> Notification:
        notification = Notification(user_id=user_id, type=type, title=title, message=message)
        self.db.add(notification)
        self.db.flush()
        return notification

    def list_for_user(self, user_id: int, page: int, page_size: int) -> tuple[Sequence[Notification], int]:
        base = select(Notification).where(Notification.user_id == user_id)
        total = self.db.scalar(select(func.count()).select_from(base.subquery())) or 0
        items = self.db.scalars(base.order_by(Notification.created_at.desc()).offset((page - 1) * page_size).limit(page_size)).all()
        return items, total

    def unread_count(self, user_id: int) -> int:
        return self.db.scalar(select(func.count(Notification.id)).where(Notification.user_id == user_id, Notification.is_read.is_(False))) or 0

    def get_for_user(self, notification_id: int, user_id: int) -> Notification | None:
        return self.db.scalar(select(Notification).where(Notification.id == notification_id, Notification.user_id == user_id))

    def mark_read(self, notification: Notification) -> Notification:
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.now(timezone.utc)
            self.db.flush()
        return notification

    def mark_all_read(self, user_id: int) -> None:
        now = datetime.now(timezone.utc)
        self.db.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=now)
        )
