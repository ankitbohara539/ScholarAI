from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_roles
from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.notification import NotificationResponse
from app.schemas.recommendation import RecommendationList
from app.services.recommendation_service import RecommendationService
from app.websocket.manager import connection_manager

router = APIRouter(prefix="/student/recommendations", tags=["recommendations"])
StudentUser = Annotated[User, Depends(require_roles(UserRole.STUDENT))]


@router.post("/generate", response_model=RecommendationList)
async def generate_recommendations(
    current_user: StudentUser,
    db: Annotated[Session, Depends(get_db)],
    top_k: Annotated[int, Query(ge=1, le=25)] = 10,
) -> RecommendationList:
    response, notification = RecommendationService(db).generate(current_user.id, top_k)
    if notification:
        payload = NotificationResponse.model_validate(notification).model_dump(mode="json")
        await connection_manager.send_to_user(current_user.id, {"event": "notification", "notification": payload})
    return response


@router.get("", response_model=RecommendationList)
def latest_recommendations(current_user: StudentUser, db: Annotated[Session, Depends(get_db)]) -> RecommendationList:
    return RecommendationService(db).latest(current_user.id)
