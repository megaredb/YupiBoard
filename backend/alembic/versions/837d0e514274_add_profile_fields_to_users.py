"""add profile fields to users

Revision ID: 837d0e514274
Revises: 0e755bac67b7
Create Date: 2026-10-24 13:34:05.562620

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "837d0e514274"
down_revision: str | Sequence[str] | None = "0e755bac67b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "users",
        sa.Column(
            "is_deleted", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
    )
    op.add_column("users", sa.Column("city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("contact_info", sa.Text(), nullable=True))
    op.add_column(
        "users",
        sa.Column(
            "rating_as_player",
            sa.Numeric(precision=3, scale=2),
            server_default="5.00",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "rating_as_organizer",
            sa.Numeric(precision=3, scale=2),
            server_default="5.00",
            nullable=False,
        ),
    )
    op.create_check_constraint(
        "ck_users_rating_as_player",
        "users",
        sa.column("rating_as_player").between(1.00, 5.00),
    )
    op.create_check_constraint(
        "ck_users_rating_as_organizer",
        "users",
        sa.column("rating_as_organizer").between(1.00, 5.00),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck_users_rating_as_organizer", "users", type_="check")
    op.drop_constraint("ck_users_rating_as_player", "users", type_="check")
    op.drop_column("users", "rating_as_organizer")
    op.drop_column("users", "rating_as_player")
    op.drop_column("users", "contact_info")
    op.drop_column("users", "city")
    op.drop_column("users", "is_deleted")
