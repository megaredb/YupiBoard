"""Remove redundant organizer id from event ratings."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a27e8b6c4d10"
down_revision: str | Sequence[str] | None = "9c4f2b71e6aa"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_event_ratings_organizer_id", table_name="event_ratings")
    op.drop_constraint(
        "event_ratings_organizer_id_fkey",
        "event_ratings",
        type_="foreignkey",
    )
    op.drop_column("event_ratings", "organizer_id")


def downgrade() -> None:
    op.add_column(
        "event_ratings",
        sa.Column("organizer_id", sa.Uuid(), nullable=True),
    )
    op.execute(
        """
        UPDATE event_ratings AS ratings
        SET organizer_id = events.organizer_id
        FROM events
        WHERE events.id = ratings.event_id
        """
    )
    op.alter_column("event_ratings", "organizer_id", nullable=False)
    op.create_foreign_key(
        "event_ratings_organizer_id_fkey",
        "event_ratings",
        "users",
        ["organizer_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_event_ratings_organizer_id",
        "event_ratings",
        ["organizer_id"],
        unique=False,
    )
