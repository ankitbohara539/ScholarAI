from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class UniversityBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    country: str = Field(min_length=2, max_length=120)
    region: str = Field(min_length=2, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    website_url: HttpUrl | None = None
    ranking: int = Field(ge=1)
    academic_reputation_score: Decimal = Field(ge=0, le=100, decimal_places=2)
    minimum_gpa: Decimal | None = Field(default=None, ge=0, le=4, decimal_places=3)
    minimum_gre_score: int | None = Field(default=None, ge=260, le=340)
    tuition_fee: Decimal | None = Field(default=None, ge=0)
    application_fee: Decimal | None = Field(default=None, ge=0)
    university_type: str | None = Field(default=None, max_length=80)
    degree_levels: list[str] | None = None
    description: str | None = None


class UniversityCreate(UniversityBase):
    model_config = ConfigDict(extra="forbid")


class UniversityUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    country: str | None = Field(default=None, min_length=2, max_length=120)
    region: str | None = Field(default=None, min_length=2, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    website_url: HttpUrl | None = None
    ranking: int | None = Field(default=None, ge=1)
    academic_reputation_score: Decimal | None = Field(default=None, ge=0, le=100)
    minimum_gpa: Decimal | None = Field(default=None, ge=0, le=4)
    minimum_gre_score: int | None = Field(default=None, ge=260, le=340)
    tuition_fee: Decimal | None = Field(default=None, ge=0)
    application_fee: Decimal | None = Field(default=None, ge=0)
    university_type: str | None = Field(default=None, max_length=80)
    degree_levels: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None

    model_config = ConfigDict(extra="forbid")


class UniversityResponse(UniversityBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UniversityPage(BaseModel):
    items: list[UniversityResponse]
    page: int
    page_size: int
    total: int
    pages: int
