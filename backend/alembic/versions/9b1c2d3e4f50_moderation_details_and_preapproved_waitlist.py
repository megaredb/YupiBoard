"""moderation details on events and pre-approved waitlist bookings

Revision ID: 9b1c2d3e4f50
Revises: f7a8b9c0d1e2
Create Date: 2026-11-24 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "9b1c2d3e4f50"
down_revision: str | Sequence[str] | None = "f7a8b9c0d1e2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "events",
        sa.Column(
            "auto_check_status",
            sa.Enum(
                "Passed",
                "Failed",
                "Unavailable",
                name="auto_check_status",
                native_enum=False,
            ),
            nullable=True,
        ),
    )
    op.add_column("events", sa.Column("moderated_by_id", sa.Uuid(), nullable=True))
    op.add_column(
        "events",
        sa.Column("moderated_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_events_moderated_by_id_users",
        "events",
        "users",
        ["moderated_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.add_column(
        "bookings",
        sa.Column(
            "is_preapproved",
            sa.Boolean(),
            server_default=sa.false(),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("bookings", "is_preapproved")
    op.drop_constraint("fk_events_moderated_by_id_users", "events", type_="foreignkey")
    op.drop_column("events", "moderated_at")
    op.drop_column("events", "moderated_by_id")
    op.drop_column("events", "auto_check_status")
