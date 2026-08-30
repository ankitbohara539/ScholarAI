from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/dashboard")
def admin_dashboard(
    _: Annotated[User, Depends(require_roles(UserRole.ADMIN))],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, Any]:
    users = UserRepository(db)
    return {
        "total_students": users.count_by_role(UserRole.STUDENT),
        "active_users": users.count_active(),
        "total_universities": None,
        "university_data_status": "Not implemented",
    }
