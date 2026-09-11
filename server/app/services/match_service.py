from dataclasses import dataclass
from decimal import Decimal
from typing import Literal

from app.models.student_profile import StudentProfile
from app.models.university import University

CriterionStatus = Literal["available", "unknown", "not_applicable"]


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
    status: CriterionStatus
    score: float | None
    weight: float
    reason: str


@dataclass(frozen=True)
class MatchResult:
    match_score: float | None
    coverage: float
    available_criteria: int
    total_criteria: int
    breakdown: dict[str, CriterionResult]


class MatchEvaluator:
    def __init__(self, weights: MatchWeights = MATCH_WEIGHTS) -> None:
        self.weights = weights
        _ = weights.total

    @staticmethod
    def gpa(student_gpa: Decimal | float | None, minimum: Decimal | float | None) -> tuple[CriterionStatus, float | None, str]:
        if minimum is None:
            return "unknown", None, "University GPA requirement is unavailable."
        if student_gpa is None:
            return "not_applicable", None, "Add a GPA to evaluate this requirement."
        value, required = float(student_gpa), float(minimum)
        if value >= required:
            return "available", 1.0, "Your GPA meets the published requirement."
        return "available", _clamp(value / required if required else 1.0), "Your GPA is below the published requirement."

    @staticmethod
    def test(student_score: int | None, minimum: int | None) -> tuple[CriterionStatus, float | None, str]:
        if minimum is None:
            return "unknown", None, "University GRE requirement is unavailable."
        if student_score is None:
            return "not_applicable", None, "Add a GRE score to evaluate this requirement."
        if student_score >= minimum:
            return "available", 1.0, "Your GRE score meets the published requirement."
        return "available", _clamp(student_score / minimum if minimum else 1.0), "Your GRE score is below the published requirement."

    @staticmethod
    def budget(
        max_budget: Decimal | float | None,
        budget_currency: str | None,
        tuition: Decimal | float | None,
        tuition_currency: str | None,
    ) -> tuple[CriterionStatus, float | None, str]:
        if max_budget is None:
            return "not_applicable", None, "Add a tuition budget and currency to evaluate affordability."
        if tuition is None or not budget_currency or not tuition_currency:
            return "unknown", None, "Budget comparison unavailable because cost or currency data is incomplete."
        if budget_currency.casefold() != tuition_currency.casefold():
            return "unknown", None, "Budget comparison unavailable because the currencies differ."
        budget, cost = float(max_budget), float(tuition)
        if cost <= budget:
            return "available", 1.0, "Published tuition is within your preferred budget."
        return "available", _clamp(budget / cost if cost else 1.0), "Published tuition is above your preferred budget."

    @staticmethod
    def program(field: str | None, programs: list[str] | None) -> tuple[CriterionStatus, float | None, str]:
        if not programs:
            return "unknown", None, "Program-level data is unavailable for this university."
        if not field:
            return "not_applicable", None, "Add an academic field to evaluate program relevance."
        wanted = field.casefold().strip()
        normalized = [program.casefold().strip() for program in programs]
        if wanted in normalized:
            return "available", 1.0, "The university lists your preferred academic field."
        wanted_tokens = set(wanted.split())
        if any(wanted_tokens & set(program.split()) for program in normalized):
            return "available", 0.6, "A related academic program is listed by the university."
        return "available", 0.0, "Your preferred field is not present in the available program data."

    def evaluate(self, profile: StudentProfile, university: University) -> MatchResult:
        values = {
            "gpa": self.gpa(profile.gpa, university.minimum_gpa),
            "test": self.test(profile.gre_score, university.minimum_gre_score),
            "budget": self.budget(profile.max_tuition_budget, profile.budget_currency, university.tuition_fee, university.currency),
            "program": self.program(profile.academic_field, university.programs),
        }
        breakdown = {
            name: CriterionResult(
                status=status,
                score=round(_clamp(score), 4) if score is not None else None,
                weight=getattr(self.weights, name),
                reason=reason,
            )
            for name, (status, score, reason) in values.items()
        }
        available = [item for item in breakdown.values() if item.status == "available" and item.score is not None and item.weight > 0]
        available_weight = sum(item.weight for item in available)
        match_score = None
        if available_weight:
            weighted = sum(item.score * item.weight for item in available) / available_weight
            match_score = round(_clamp(weighted) * 100, 1)
        positive_criteria = [item for item in breakdown.values() if item.weight > 0]
        coverage = sum(item.weight for item in available) / sum(item.weight for item in positive_criteria)
        return MatchResult(
            match_score=match_score,
            coverage=round(coverage, 4),
            available_criteria=len(available),
            total_criteria=len(positive_criteria),
            breakdown=breakdown,
        )
