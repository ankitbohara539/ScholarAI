from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ScholarshipBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    amount: Decimal = Field(gt=0)
    minimum_gpa: Decimal | None = Field(default=None, ge=0, le=4)
    minimum_test_score: int | None = Field(default=None, ge=0, le=340)
    eligibility_description: str | None = Field(default=None, max_length=2000)
    is_active: bool = True


class ScholarshipCreate(ScholarshipBase):
    model_config = ConfigDict(extra="forbid")


class ScholarshipUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    amount: Decimal | None = Field(default=None, gt=0)
    minimum_gpa: Decimal | None = Field(default=None, ge=0, le=4)
    minimum_test_score: int | None = Field(default=None, ge=0, le=340)
    eligibility_description: str | None = Field(default=None, max_length=2000)
    is_active: bool | None = None

    model_config = ConfigDict(extra="forbid")


class ScholarshipResponse(ScholarshipBase):
    id: int
    university_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
