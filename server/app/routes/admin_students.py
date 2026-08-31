from typing import Annotated

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.student_profile import VerificationStatus
from app.models.user import User, UserRole
from app.schemas.admin_student import AdminStudentDetail, AdminStudentPage, RejectionRequest
from app.schemas.notification import NotificationResponse
from app.services.admin_student_service import AdminStudentService
from app.websocket.manager import connection_manager

router = APIRouter(prefix="/admin/students", tags=["admin-students"])
AdminUser = Annotated[User, Depends(require_roles(UserRole.ADMIN))]


@router.get("", response_model=AdminStudentPage)
def list_students(
    _: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: str | None = None,
    verification_status: VerificationStatus | None = None,
    account_status: Annotated[str | None, Query(pattern="^(active|suspended)$")] = None,
) -> AdminStudentPage:
    return AdminStudentService(db).list(page=page, page_size=page_size, search=search, verification_status=verification_status, account_status=account_status)


@router.get("/{student_id}", response_model=AdminStudentDetail)
def get_student(student_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> AdminStudentDetail:
    return AdminStudentService(db).detail(student_id)


async def _deliver(notification: NotificationResponse, user_id: int) -> None:
    await connection_manager.send_to_user(user_id, {"event": "notification", "notification": notification.model_dump(mode="json")})


@router.post("/{student_id}/verify", response_model=NotificationResponse)
async def verify_student(student_id: int, admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> NotificationResponse:
    response = NotificationResponse.model_validate(AdminStudentService(db).verify(student_id, admin.id))
    await _deliver(response, student_id)
    return response


@router.post("/{student_id}/reject", response_model=NotificationResponse)
async def reject_student(student_id: int, data: RejectionRequest, admin: AdminUser, db: Annotated[Session, Depends(get_db)]) -> NotificationResponse:
    response = NotificationResponse.model_validate(AdminStudentService(db).reject(student_id, admin.id, data.reason))
    await _deliver(response, student_id)
    return response


@router.post("/{student_id}/suspend", response_model=NotificationResponse)
async def suspend_student(student_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> NotificationResponse:
    response = NotificationResponse.model_validate(AdminStudentService(db).set_suspended(student_id, True))
    await _deliver(response, student_id)
    await connection_manager.close_user(student_id)
    return response


@router.post("/{student_id}/reactivate", response_model=NotificationResponse)
async def reactivate_student(student_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> NotificationResponse:
    response = NotificationResponse.model_validate(AdminStudentService(db).set_suspended(student_id, False))
    await _deliver(response, student_id)
    return response


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(student_id: int, _: AdminUser, db: Annotated[Session, Depends(get_db)]) -> Response:
    AdminStudentService(db).soft_delete(student_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
