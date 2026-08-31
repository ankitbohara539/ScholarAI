import math

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.schemas.notification import NotificationPage, NotificationResponse


class NotificationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.notifications = NotificationRepository(db)

    def list(self, user_id: int, page: int, page_size: int) -> NotificationPage:
        items, total = self.notifications.list_for_user(user_id, page, page_size)
        return NotificationPage(
            items=[NotificationResponse.model_validate(item) for item in items],
            page=page,
            page_size=page_size,
            total=total,
            pages=math.ceil(total / page_size) if total else 0,
            unread_count=self.notifications.unread_count(user_id),
        )

    def mark_read(self, notification_id: int, user_id: int) -> Notification:
        notification = self.notifications.get_for_user(notification_id, user_id)
        if notification is None:
            raise NotFoundException("Notification not found")
        self.notifications.mark_read(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification

    def mark_all_read(self, user_id: int) -> None:
        self.notifications.mark_all_read(user_id)
        self.db.commit()
