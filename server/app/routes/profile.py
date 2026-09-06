from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import CurrentUser
from app.db.database import get_db
from app.schemas.user import UserProfileUpdate, UserResponse
from app.services.user_profile_service import UserProfileService

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserResponse)
def get_profile(current_user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.patch("", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    return UserResponse.model_validate(UserProfileService(db).update(current_user, data))


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    avatar: Annotated[UploadFile, File()],
) -> UserResponse:
    content = await avatar.read(settings.avatar_max_bytes + 1)
    return UserResponse.model_validate(
        UserProfileService(db).update_avatar(current_user, content, avatar.content_type)
    )


@router.delete("/avatar", response_model=UserResponse)
def remove_avatar(
    current_user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> UserResponse:
    return UserResponse.model_validate(UserProfileService(db).remove_avatar(current_user))
