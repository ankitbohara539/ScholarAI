from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/student", tags=["student"])


@router.get("/dashboard")
def student_dashboard(
    current_user: Annotated[User, Depends(require_roles(UserRole.STUDENT))],
) -> dict[str, Any]:
    return {
        "message": f"Welcome, {current_user.full_name}",
        "recommended_universities": 0,
        "saved_universities": 0,
        "profile_completion": "Basic profile",
    }
