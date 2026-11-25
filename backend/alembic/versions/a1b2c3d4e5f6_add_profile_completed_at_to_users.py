"""add profile_completed_at to users

Revision ID: a1b2c3d4e5f6
Revises: 9b1c2d3e4f50
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "9b1c2d3e4f50"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("profile_completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Existing users with both names already passed the old "complete profile" check.
    op.execute(
        "UPDATE users SET profile_completed_at = created_at "
        "WHERE trim(coalesce(first_name, '')) <> '' "
        "AND trim(coalesce(last_name, '')) <> ''"
    )


def downgrade() -> None:
    op.drop_column("users", "profile_completed_at")
