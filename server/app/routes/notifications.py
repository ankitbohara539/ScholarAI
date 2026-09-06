from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import CurrentUser
from app.db.database import get_db
from app.schemas.notification import NotificationPage, NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=NotificationPage)
def list_notifications(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> NotificationPage:
    return NotificationService(db).list(current_user.id, page, page_size)


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_notifications_read(current_user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> Response:
    NotificationService(db).mark_all_read(current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> NotificationResponse:
    return NotificationResponse.model_validate(NotificationService(db).mark_read(notification_id, current_user.id))
