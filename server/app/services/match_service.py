from dataclasses import dataclass
from decimal import Decimal

from app.models.student_profile import StudentProfile
from app.models.university import University


@dataclass(frozen=True)
class MatchWeights:
    gpa: float = 0.30
    test: float = 0.20
    budget: float = 0.25
    program: float = 0.25

    @property
    def total(self) -> float:
        value = self.gpa + self.test + self.budget + self.program
        if value <= 0:
            raise ValueError("Match weight total must be positive")
        return value


MATCH_WEIGHTS = MatchWeights()


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


@dataclass(frozen=True)
class CriterionResult:
    score: float
    weight: float
    reason: str


@dataclass(frozen=True)
class MatchResult:
    match_score: float
    breakdown: dict[str, CriterionResult]


class MatchEvaluator:
    def __init__(self, weights: MatchWeights = MATCH_WEIGHTS) -> None:
        self.weights = weights
        _ = weights.total

    @staticmethod
    def gpa(student_gpa: Decimal | float | None, minimum: Decimal | float | None) -> tuple[float, str]:
        if minimum is None:
            return 0.75, "The university has not published a minimum GPA."
        if student_gpa is None:
            return 0.0, "Add a GPA to evaluate this requirement."
        value, required = float(student_gpa), float(minimum)
        if value >= required:
            return 1.0, "Your GPA meets the published requirement."
        return _clamp(value / required if required else 1.0), "Your GPA is below the published requirement."

    @staticmethod
    def test(student_score: int | None, minimum: int | None) -> tuple[float, str]:
        if minimum is None:
            return 0.75, "The university has not published a minimum GRE score."
        if student_score is None:
            return 0.0, "Add a GRE score to evaluate this requirement."
        if student_score >= minimum:
            return 1.0, "Your GRE score meets the published requirement."
        return _clamp(student_score / minimum if minimum else 1.0), "Your GRE score is below the published requirement."

    @staticmethod
    def budget(max_budget: Decimal | float | None, tuition: Decimal | float | None) -> tuple[float, str]:
        if tuition is None:
            return 0.65, "Tuition data is unavailable, so budget fit is uncertain."
        if max_budget is None:
            return 0.65, "Add a tuition budget to evaluate affordability."
        budget, cost = float(max_budget), float(tuition)
        if cost <= budget:
            return 1.0, "Published tuition is within your preferred budget."
        return _clamp(budget / cost if cost else 1.0), "Published tuition is above your preferred budget."

    @staticmethod
    def program(field: str | None, programs: list[str] | None) -> tuple[float, str]:
        if not programs:
            return 0.5, "Program-level data is unavailable for this university."
        if not field:
            return 0.0, "Add an academic field to evaluate program relevance."
        wanted = field.casefold().strip()
        normalized = [program.casefold().strip() for program in programs]
        if wanted in normalized:
            return 1.0, "The university lists your preferred academic field."
        wanted_tokens = set(wanted.split())
        if any(wanted_tokens & set(program.split()) for program in normalized):
            return 0.6, "A related academic program is listed by the university."
        return 0.0, "Your preferred field is not present in the available program data."

    def evaluate(self, profile: StudentProfile, university: University) -> MatchResult:
        values = {
            "gpa": self.gpa(profile.gpa, university.minimum_gpa),
            "test": self.test(profile.gre_score, university.minimum_gre_score),
            "budget": self.budget(profile.max_tuition_budget, university.tuition_fee),
            "program": self.program(profile.academic_field, university.programs),
        }
        breakdown = {
            name: CriterionResult(score=round(_clamp(score), 4), weight=getattr(self.weights, name), reason=reason)
            for name, (score, reason) in values.items()
        }
        weighted = sum(item.score * item.weight for item in breakdown.values()) / self.weights.total
        return MatchResult(match_score=round(_clamp(weighted) * 100, 1), breakdown=breakdown)
