"""add_rejection_reason_to_bookings

Revision ID: d4e5f6a7b8c9
Revises: 59d321c09a27
Create Date: 2026-11-17 20:35:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d4e5f6a7b8c9"
down_revision: str | Sequence[str] | None = "59d321c09a27"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "bookings",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("bookings", "rejection_reason")
