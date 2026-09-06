from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserProfileUpdate
from app.services.profile_storage_service import ProfileStorageService


class UserProfileService:
    def __init__(self, db: Session, storage: ProfileStorageService | None = None) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.storage = storage or ProfileStorageService()

    def update(self, user: User, data: UserProfileUpdate) -> User:
        self.users.update_profile(user, full_name=data.full_name)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_avatar(self, user: User, content: bytes, content_type: str | None) -> User:
        previous = user.profile_picture_url
        public_url = self.storage.save(content, content_type)
        user.profile_picture_url = public_url
        self.db.commit()
        self.db.refresh(user)
        self.storage.delete(previous)
        return user

    def remove_avatar(self, user: User) -> User:
        previous = user.profile_picture_url
        user.profile_picture_url = None
        self.db.commit()
        self.db.refresh(user)
        self.storage.delete(previous)
        return user
