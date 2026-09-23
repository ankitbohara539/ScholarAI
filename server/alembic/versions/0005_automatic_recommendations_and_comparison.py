"""Add academic GPA preferences, recommendation versions, and comparison metrics.

Revision ID: 0005_auto_recommendations
Revises: 0004_add_budget_currency
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_auto_recommendations"
down_revision: str | None = "0004_add_budget_currency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("student_profiles", sa.Column("minimum_gpa_preference", sa.Numeric(2, 1), server_default="1.0", nullable=False))
    op.add_column("student_profiles", sa.Column("maximum_gpa_preference", sa.Numeric(2, 1), server_default="4.0", nullable=False))
    op.add_column("student_profiles", sa.Column("recommendation_profile_version", sa.String(length=64), nullable=True))
    op.add_column("student_profiles", sa.Column("recommendation_status", sa.String(length=20), server_default="pending", nullable=False))
    op.add_column("student_profiles", sa.Column("recommendation_error", sa.String(length=500), nullable=True))
    op.add_column("student_profiles", sa.Column("recommendations_generated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("recommendations", sa.Column("profile_version", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_recommendations_profile_version"), "recommendations", ["profile_version"], unique=False)
    op.add_column("universities", sa.Column("graduation_rate", sa.Numeric(5, 2), nullable=True))
    op.add_column("universities", sa.Column("student_population", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("universities", "student_population")
    op.drop_column("universities", "graduation_rate")
    op.drop_index(op.f("ix_recommendations_profile_version"), table_name="recommendations")
    op.drop_column("recommendations", "profile_version")
    op.drop_column("student_profiles", "maximum_gpa_preference")
    op.drop_column("student_profiles", "minimum_gpa_preference")
    op.drop_column("student_profiles", "recommendations_generated_at")
    op.drop_column("student_profiles", "recommendation_error")
    op.drop_column("student_profiles", "recommendation_status")
    op.drop_column("student_profiles", "recommendation_profile_version")
