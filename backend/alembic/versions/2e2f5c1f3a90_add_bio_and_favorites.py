"""add bio and favorites

Revision ID: 2e2f5c1f3a90
Revises: c8a7f6c2419f
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "2e2f5c1f3a90"
down_revision: str | Sequence[str] | None = "c8a7f6c2419f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("bio", sa.Text(), nullable=True))
    op.create_table(
        "favorites",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "event_id"),
    )


def downgrade() -> None:
    op.drop_table("favorites")
    op.drop_column("users", "bio")
