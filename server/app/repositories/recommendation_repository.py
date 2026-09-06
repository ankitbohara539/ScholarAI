from collections.abc import Sequence
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml.predictor import Prediction
from app.models.recommendation import Recommendation
from app.models.university import University


class RecommendationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_generation(
        self,
        *,
        student_id: int,
        generation_id: str,
        predictions: list[Prediction],
        model_version: str,
    ) -> list[Recommendation]:
        rows = [
            Recommendation(
                student_id=student_id,
                university_id=prediction.university_id,
                generation_id=generation_id,
                score=Decimal(str(round(prediction.score, 6))),
                ml_score=Decimal(str(round(prediction.ml_score if prediction.ml_score is not None else prediction.score, 6))),
                rank=rank,
                category=prediction.category,
                model_version=model_version,
            )
            for rank, prediction in enumerate(predictions, start=1)
        ]
        self.db.add_all(rows)
        self.db.flush()
        return rows

    def latest(self, student_id: int) -> Sequence[tuple[Recommendation, University]]:
        latest_generation = self.db.scalar(
            select(Recommendation.generation_id)
            .where(Recommendation.student_id == student_id)
            .order_by(Recommendation.id.desc())
            .limit(1)
        )
        if latest_generation is None:
            return []
        return self.db.execute(
            select(Recommendation, University)
            .join(University, University.id == Recommendation.university_id)
            .where(Recommendation.student_id == student_id, Recommendation.generation_id == latest_generation)
            .order_by(Recommendation.rank)
        ).all()

    def latest_count(self, student_id: int) -> int:
        return len(self.latest(student_id))
