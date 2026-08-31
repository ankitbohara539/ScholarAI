"""Add profiles, universities, recommendations, notifications, and soft deletion.

Revision ID: 0002_platform_features
Revises: 0001_create_users
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0002_platform_features"
down_revision: str | None = "0001_create_users"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f("ix_users_deleted_at"), "users", ["deleted_at"], unique=False)

    op.create_table(
        "universities",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=120), nullable=False),
        sa.Column("region", sa.String(length=120), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
        sa.Column("ranking", sa.Integer(), nullable=False),
        sa.Column("academic_reputation_score", sa.Numeric(5, 2), nullable=False),
        sa.Column("minimum_gpa", sa.Numeric(4, 3), nullable=True),
        sa.Column("minimum_gre_score", sa.Integer(), nullable=True),
        sa.Column("tuition_fee", sa.Numeric(12, 2), nullable=True),
        sa.Column("application_fee", sa.Numeric(10, 2), nullable=True),
        sa.Column("university_type", sa.String(length=80), nullable=True),
        sa.Column("degree_levels", sa.JSON(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", "country", name="uq_university_name_country"),
    )
    for column in ("name", "country", "region", "ranking", "university_type", "is_active", "deleted_at"):
        op.create_index(op.f(f"ix_universities_{column}"), "universities", [column], unique=False)

    op.create_table(
        "student_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("gpa", sa.Numeric(4, 3), nullable=True),
        sa.Column("gre_score", sa.Integer(), nullable=True),
        sa.Column("toefl_score", sa.Integer(), nullable=True),
        sa.Column("sop_rating", sa.Numeric(2, 1), nullable=True),
        sa.Column("lor_rating", sa.Numeric(2, 1), nullable=True),
        sa.Column("has_research", sa.Boolean(), nullable=True),
        sa.Column("academic_field", sa.String(length=120), nullable=True),
        sa.Column("academic_reputation_preference", sa.Integer(), nullable=True),
        sa.Column("preferred_country", sa.String(length=120), nullable=True),
        sa.Column("preferred_region", sa.String(length=120), nullable=True),
        sa.Column("preferred_city", sa.String(length=120), nullable=True),
        sa.Column("preferred_degree_level", sa.String(length=80), nullable=True),
        sa.Column("max_tuition_budget", sa.Numeric(12, 2), nullable=True),
        sa.Column("preferred_university_type", sa.String(length=80), nullable=True),
        sa.Column("profile_completion_percentage", sa.Integer(), server_default="0", nullable=False),
        sa.Column("verification_status", sa.Enum("draft", "pending", "verified", "rejected", name="verification_status"), server_default="draft", nullable=False),
        sa.Column("submitted_for_verification_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by_admin_id", sa.Integer(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["verified_by_admin_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_student_profiles_user_id"), "student_profiles", ["user_id"], unique=True)
    op.create_index(op.f("ix_student_profiles_verification_status"), "student_profiles", ["verification_status"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("type", sa.Enum("profile_verified", "profile_rejected", "account_suspended", "account_reactivated", "recommendation_ready", name="notification_type"), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    for column in ("user_id", "is_read", "created_at"):
        op.create_index(op.f(f"ix_notifications_{column}"), "notifications", [column], unique=False)

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("student_id", sa.Integer(), nullable=False),
        sa.Column("university_id", sa.Integer(), nullable=False),
        sa.Column("generation_id", sa.String(length=36), nullable=False),
        sa.Column("score", sa.Numeric(7, 6), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(length=20), nullable=False),
        sa.Column("model_version", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["university_id"], ["universities.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("generation_id", "rank", name="uq_recommendation_generation_rank"),
    )
    for column in ("student_id", "university_id", "generation_id", "created_at"):
        op.create_index(op.f(f"ix_recommendations_{column}"), "recommendations", [column], unique=False)


def downgrade() -> None:
    op.drop_table("recommendations")
    op.drop_table("notifications")
    op.drop_table("student_profiles")
    op.drop_table("universities")
    op.drop_index(op.f("ix_users_deleted_at"), table_name="users")
    op.drop_column("users", "deleted_at")
