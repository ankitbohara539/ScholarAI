"""Add explicit student budget currency.

Revision ID: 0004_add_budget_currency
Revises: 0003_enhancement_features
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_add_budget_currency"
down_revision: str | None = "0003_enhancement_features"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("student_profiles", sa.Column("budget_currency", sa.String(length=3), nullable=True))


def downgrade() -> None:
    op.drop_column("student_profiles", "budget_currency")
