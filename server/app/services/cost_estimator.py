from dataclasses import dataclass

from app.models.student_profile import StudentProfile
from app.models.university import University


@dataclass(frozen=True)
class CostEstimate:
    tuition: float | None
    living_cost: float | None
    application_fee: float | None
    potential_aid: float | None
    estimated_total: float | None
    currency: str | None
    missing_fields: list[str]


class CostEstimator:
    @staticmethod
    def estimate(profile: StudentProfile, university: University) -> CostEstimate:
        active = [item for item in university.scholarships if item.is_active]
        eligible = [
            item for item in active
            if (item.minimum_gpa is None or (profile.gpa is not None and profile.gpa >= item.minimum_gpa))
            and (item.minimum_test_score is None or (profile.gre_score is not None and profile.gre_score >= item.minimum_test_score))
        ]
        aid = max((float(item.amount) for item in eligible), default=0.0)
        tuition = float(university.tuition_fee) if university.tuition_fee is not None else None
        living = float(university.estimated_living_cost) if university.estimated_living_cost is not None else None
        application = float(university.application_fee) if university.application_fee is not None else None
        missing = [
            label for label, value in (("tuition", tuition), ("living_cost", living), ("application_fee", application))
            if value is None
        ]
        total = None if missing else max(0.0, tuition + living + application - aid)  # type: ignore[operator]
        return CostEstimate(
            tuition=tuition,
            living_cost=living,
            application_fee=application,
            potential_aid=aid if eligible else None,
            estimated_total=round(total, 2) if total is not None else None,
            currency=university.currency,
            missing_fields=missing,
        )
