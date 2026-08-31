import logging
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleException, ModelUnavailableException
from app.ml.exceptions import ArtifactValidationError
from app.ml.predictor import RecommendationPredictor
from app.models.notification import Notification, NotificationType
from app.models.student_profile import VerificationStatus
from app.repositories.notification_repository import NotificationRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.student_profile_repository import StudentProfileRepository
from app.repositories.university_repository import UniversityRepository
from app.schemas.recommendation import RecommendationItem, RecommendationList
from app.schemas.university import UniversityResponse

logger = logging.getLogger(__name__)


class RecommendationService:
    def __init__(self, db: Session, predictor: RecommendationPredictor | None = None) -> None:
        self.db = db
        self.predictor = predictor or RecommendationPredictor()
        self.profiles = StudentProfileRepository(db)
        self.universities = UniversityRepository(db)
        self.recommendations = RecommendationRepository(db)
        self.notifications = NotificationRepository(db)

    def generate(self, student_id: int, top_k: int) -> tuple[RecommendationList, Notification | None]:
        profile = self.profiles.get_by_user_id(student_id)
        if profile is None or profile.verification_status != VerificationStatus.VERIFIED:
            raise BusinessRuleException("A verified student profile is required to generate recommendations")
        universities = list(self.universities.active_for_recommendations())
        try:
            predictions, model_version = self.predictor.predict(profile, universities, top_k)
        except ArtifactValidationError as exc:
            logger.error("Recommendation generation failed student_id=%s reason=artifact_validation", student_id)
            raise ModelUnavailableException() from exc

        generation_id = str(uuid4())
        rows = self.recommendations.create_generation(
            student_id=student_id,
            generation_id=generation_id,
            predictions=predictions,
            model_version=model_version,
        )
        notification = None
        if rows:
            notification = self.notifications.create(
                user_id=student_id,
                type=NotificationType.RECOMMENDATION_READY,
                title="Recommendations Ready",
                message=f"Your latest {len(rows)} university recommendations are ready.",
            )
        self.db.commit()
        university_by_id = {item.id: item for item in universities}
        response = RecommendationList(
            generation_id=generation_id,
            model_version=model_version,
            generated_at=rows[0].created_at if rows else datetime.now(timezone.utc),
            recommendations=[
                RecommendationItem(
                    university=UniversityResponse.model_validate(university_by_id[row.university_id]),
                    score=float(row.score),
                    rank=row.rank,
                    category=row.category,
                )
                for row in rows
            ],
        )
        if notification:
            self.db.refresh(notification)
        return response, notification

    def latest(self, student_id: int) -> RecommendationList:
        rows = self.recommendations.latest(student_id)
        if not rows:
            return RecommendationList(generation_id=None, model_version=None, generated_at=None, recommendations=[])
        first = rows[0][0]
        return RecommendationList(
            generation_id=first.generation_id,
            model_version=first.model_version,
            generated_at=first.created_at,
            recommendations=[
                RecommendationItem(
                    university=UniversityResponse.model_validate(university),
                    score=float(recommendation.score),
                    rank=recommendation.rank,
                    category=recommendation.category,
                )
                for recommendation, university in rows
            ],
        )
