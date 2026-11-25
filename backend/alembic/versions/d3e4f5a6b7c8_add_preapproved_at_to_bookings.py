"""add preapproved_at to bookings

Revision ID: d3e4f5a6b7c8
Revises: c2d3e4f5a6b7
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d3e4f5a6b7c8"
down_revision: str | Sequence[str] | None = "c2d3e4f5a6b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("preapproved_at", sa.DateTime(timezone=True), nullable=True),
    )
    # Accepting was the last change to these rows, so updated_at is the closest record of
    # when it happened.
    op.execute(
        "UPDATE bookings SET preapproved_at = updated_at "
        "WHERE is_preapproved AND status = 'Waitlist'"
    )


def downgrade() -> None:
    op.drop_column("bookings", "preapproved_at")
