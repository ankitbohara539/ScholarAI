from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.exceptions import BusinessRuleException
from app.models.student_profile import StudentProfile, VerificationStatus
from app.repositories.student_profile_repository import StudentProfileRepository
from app.schemas.student_profile import AcademicProfileUpdate, PreferenceProfileUpdate

REQUIRED_PROFILE_FIELDS = (
    "gpa",
    "gre_score",
    "toefl_score",
    "sop_rating",
    "lor_rating",
    "has_research",
    "academic_field",
    "academic_reputation_preference",
    "preferred_country",
    "preferred_region",
    "preferred_degree_level",
)


def calculate_completion(profile: StudentProfile) -> int:
    completed = sum(getattr(profile, field) is not None for field in REQUIRED_PROFILE_FIELDS)
    return round(completed / len(REQUIRED_PROFILE_FIELDS) * 100)


class StudentProfileService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.profiles = StudentProfileRepository(db)

    def get(self, user_id: int) -> StudentProfile:
        profile = self.profiles.get_or_create(user_id)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    @staticmethod
    def _ensure_editable(profile: StudentProfile) -> None:
        if profile.verification_status in {VerificationStatus.PENDING, VerificationStatus.VERIFIED}:
            raise BusinessRuleException("Profile cannot be edited while pending or verified")

    def _save(self, user_id: int, values: dict[str, object]) -> StudentProfile:
        profile = self.profiles.get_or_create(user_id)
        self._ensure_editable(profile)
        if profile.verification_status == VerificationStatus.REJECTED:
            profile.verification_status = VerificationStatus.DRAFT
            profile.rejection_reason = None
        self.profiles.update(profile, values)
        profile.profile_completion_percentage = calculate_completion(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def save_academic(self, user_id: int, data: AcademicProfileUpdate) -> StudentProfile:
        return self._save(user_id, data.model_dump())

    def save_preferences(self, user_id: int, data: PreferenceProfileUpdate) -> StudentProfile:
        return self._save(user_id, data.model_dump())

    def submit(self, user_id: int) -> StudentProfile:
        profile = self.profiles.get_or_create(user_id)
        if profile.profile_completion_percentage != 100:
            raise BusinessRuleException("Complete all required profile fields before submission")
        if profile.verification_status == VerificationStatus.PENDING:
            raise BusinessRuleException("Profile is already pending verification")
        if profile.verification_status == VerificationStatus.VERIFIED:
            raise BusinessRuleException("Profile is already verified")
        profile.verification_status = VerificationStatus.PENDING
        profile.submitted_for_verification_at = datetime.now(timezone.utc)
        profile.rejection_reason = None
        self.db.commit()
        self.db.refresh(profile)
        return profile
