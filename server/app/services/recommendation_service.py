import logging
from dataclasses import asdict
from datetime import datetime, timezone
from types import SimpleNamespace
from uuid import uuid4

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleException, ModelUnavailableException
from app.ml.exceptions import ArtifactValidationError
from app.ml.predictor import Prediction, RecommendationPredictor
from app.models.notification import Notification, NotificationType
from app.models.student_profile import VerificationStatus
from app.repositories.notification_repository import NotificationRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.student_profile_repository import StudentProfileRepository
from app.repositories.university_repository import UniversityRepository
from app.schemas.recommendation import RecommendationItem, RecommendationList, SimulationRequest
from app.services.cost_estimator import CostEstimator
from app.services.match_service import MatchEvaluator
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
        self.match_evaluator = MatchEvaluator()
        self.cost_estimator = CostEstimator()

    def _item(self, profile: object, university: object, *, score: float, ml_score: float, rank: int, category: str) -> RecommendationItem:
        return RecommendationItem(
            university=UniversityResponse.model_validate(university),
            score=score,
            ml_score=ml_score,
            rank=rank,
            category=category,
            match=asdict(self.match_evaluator.evaluate(profile, university)),  # type: ignore[arg-type]
            cost=asdict(self.cost_estimator.estimate(profile, university)),  # type: ignore[arg-type]
        )

    def _recommend(self, profile: object, top_k: int) -> tuple[list[RecommendationItem], str]:
        """Single recommendation path shared by persisted generation and simulation."""
        universities = list(self.universities.active_for_recommendations())
        try:
            predictions, model_version = self.predictor.predict(profile, universities, top_k)  # type: ignore[arg-type]
        except ArtifactValidationError as exc:
            logger.error("Recommendation inference failed reason=artifact_validation")
            raise ModelUnavailableException() from exc
        university_by_id = {item.id: item for item in universities}
        return [
            self._item(
                profile,
                university_by_id[prediction.university_id],
                score=prediction.score,
                ml_score=prediction.ml_score if prediction.ml_score is not None else prediction.score,
                rank=rank,
                category=prediction.category,
            )
            for rank, prediction in enumerate(predictions, start=1)
        ], model_version

    def generate(self, student_id: int, top_k: int) -> tuple[RecommendationList, Notification | None]:
        profile = self.profiles.get_by_user_id(student_id)
        if profile is None or profile.verification_status != VerificationStatus.VERIFIED:
            raise BusinessRuleException("A verified student profile is required to generate recommendations")
        items, model_version = self._recommend(profile, top_k)

        generation_id = str(uuid4())
        rows = self.recommendations.create_generation(
            student_id=student_id,
            generation_id=generation_id,
            predictions=[
                Prediction(
                    university_id=item.university.id,
                    score=item.score,
                    ml_score=item.ml_score,
                    category=item.category,
                )
                for item in items
            ],
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
        response = RecommendationList(
            generation_id=generation_id,
            model_version=model_version,
            generated_at=rows[0].created_at if rows else datetime.now(timezone.utc),
            recommendations=[item.model_copy(update={"rank": row.rank}) for item, row in zip(items, rows, strict=True)],
        )
        if notification:
            self.db.refresh(notification)
        return response, notification

    def latest(self, student_id: int) -> RecommendationList:
        rows = self.recommendations.latest(student_id)
        if not rows:
            return RecommendationList(generation_id=None, model_version=None, generated_at=None, recommendations=[])
        profile = self.profiles.get_by_user_id(student_id)
        first = rows[0][0]
        return RecommendationList(
            generation_id=first.generation_id,
            model_version=first.model_version,
            generated_at=first.created_at,
            recommendations=[
                self._item(
                    profile, university, score=float(recommendation.score),
                    ml_score=float(recommendation.ml_score if recommendation.ml_score is not None else recommendation.score),
                    rank=recommendation.rank, category=recommendation.category,
                )
                for recommendation, university in rows
            ],
        )

    def simulate(self, student_id: int, data: SimulationRequest) -> RecommendationList:
        profile = self.profiles.get_by_user_id(student_id)
        if profile is None or profile.verification_status != VerificationStatus.VERIFIED:
            raise BusinessRuleException("A verified student profile is required to simulate recommendations")
        values = {
            column: getattr(profile, column)
            for column in (
                "gpa", "gre_score", "toefl_score", "sop_rating", "lor_rating", "has_research",
                "academic_field", "academic_reputation_preference", "preferred_country", "preferred_region",
                "preferred_city", "preferred_degree_level", "max_tuition_budget", "budget_currency",
                "preferred_university_type",
            )
        }
        if data.gpa is not None:
            values["gpa"] = data.gpa
        if data.gre_score is not None:
            values["gre_score"] = data.gre_score
        if data.budget is not None:
            values["max_tuition_budget"] = data.budget
        if data.budget_currency is not None:
            values["budget_currency"] = data.budget_currency.upper()
        simulated = SimpleNamespace(**values)
        items, model_version = self._recommend(simulated, data.top_k)
        return RecommendationList(
            generation_id=None,
            model_version=model_version,
            generated_at=datetime.now(timezone.utc),
            recommendations=items,
        )
