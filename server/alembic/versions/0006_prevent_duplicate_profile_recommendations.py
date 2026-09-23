"""Prevent duplicate recommendation rows for a profile version.

Revision ID: 0006_unique_profile_recs
Revises: 0005_auto_recommendations
"""
from collections.abc import Sequence

from alembic import op

revision: str = "0006_unique_profile_recs"
down_revision: str | None = "0005_auto_recommendations"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_unique_constraint(
        "uq_recommendation_profile_version_rank",
        "recommendations",
        ["student_id", "profile_version", "rank"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_recommendation_profile_version_rank", "recommendations", type_="unique")
