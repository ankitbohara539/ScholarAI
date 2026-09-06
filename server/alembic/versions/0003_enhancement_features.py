"""Add account profiles, explainable matching data, and scholarships.

Revision ID: 0003_enhancement_features
Revises: 0002_platform_features
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_enhancement_features"
down_revision: str | None = "0002_platform_features"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

OLD_NOTIFICATION_TYPES = (
    "profile_verified", "profile_rejected", "account_suspended",
    "account_reactivated", "recommendation_ready",
)
NEW_NOTIFICATION_TYPES = ("profile_submitted", *OLD_NOTIFICATION_TYPES)


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_picture_url", sa.String(length=500), nullable=True))
    op.add_column("recommendations", sa.Column("ml_score", sa.Numeric(7, 6), nullable=True))
    op.add_column("universities", sa.Column("estimated_living_cost", sa.Numeric(12, 2), nullable=True))
    op.add_column("universities", sa.Column("currency", sa.String(length=3), nullable=True))
    op.add_column("universities", sa.Column("acceptance_rate", sa.Numeric(5, 2), nullable=True))
    op.add_column("universities", sa.Column("programs", sa.JSON(), nullable=True))
    op.create_table(
        "scholarships",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("university_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("minimum_gpa", sa.Numeric(4, 3), nullable=True),
        sa.Column("minimum_test_score", sa.Integer(), nullable=True),
        sa.Column("eligibility_description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["university_id"], ["universities.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_scholarships_university_id"), "scholarships", ["university_id"])
    op.create_index(op.f("ix_scholarships_is_active"), "scholarships", ["is_active"])
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "notifications", "type",
            existing_type=sa.Enum(*OLD_NOTIFICATION_TYPES, name="notification_type"),
            type_=sa.Enum(*NEW_NOTIFICATION_TYPES, name="notification_type"),
            existing_nullable=False,
        )


def downgrade() -> None:
    if op.get_bind().dialect.name == "mysql":
        op.alter_column(
            "notifications", "type",
            existing_type=sa.Enum(*NEW_NOTIFICATION_TYPES, name="notification_type"),
            type_=sa.Enum(*OLD_NOTIFICATION_TYPES, name="notification_type"),
            existing_nullable=False,
        )
    op.drop_index(op.f("ix_scholarships_is_active"), table_name="scholarships")
    op.drop_index(op.f("ix_scholarships_university_id"), table_name="scholarships")
    op.drop_table("scholarships")
    op.drop_column("universities", "programs")
    op.drop_column("universities", "acceptance_rate")
    op.drop_column("universities", "currency")
    op.drop_column("universities", "estimated_living_cost")
    op.drop_column("users", "profile_picture_url")
    op.drop_column("recommendations", "ml_score")
