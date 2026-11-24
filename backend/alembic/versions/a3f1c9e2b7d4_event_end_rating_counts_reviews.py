"""event_end_rating_counts_reviews

Make events.end_datetime required (backfilled as start + 4h), add rating
counters to users and create the reviews table.

Revision ID: a3f1c9e2b7d4
Revises: d4e5f6a7b8c9
Create Date: 2026-11-22 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a3f1c9e2b7d4"
down_revision: str | Sequence[str] | None = "d4e5f6a7b8c9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        "UPDATE events SET end_datetime = start_datetime + interval '4 hours' "
        "WHERE end_datetime IS NULL"
    )
    op.alter_column(
        "events",
        "end_datetime",
        existing_type=sa.DateTime(timezone=True),
        nullable=False,
    )
    op.create_index(
        op.f("ix_events_end_datetime"), "events", ["end_datetime"], unique=False
    )

    # users: number of reviews behind each rating.
    op.add_column(
        "users",
        sa.Column(
            "rating_as_player_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )
    op.add_column(
        "users",
        sa.Column(
            "rating_as_organizer_count",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
    )

    op.create_table(
        "reviews",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("reviewer_id", sa.Uuid(), nullable=False),
        sa.Column("reviewee_id", sa.Uuid(), nullable=False),
        sa.Column(
            "target_role",
            sa.Enum(
                "Player",
                "Organizer",
                name="review_target_role",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("score", sa.SmallInteger(), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("score BETWEEN 1 AND 5", name="ck_reviews_score_range"),
        sa.CheckConstraint("reviewer_id <> reviewee_id", name="ck_reviews_not_self"),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewee_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "event_id",
            "reviewer_id",
            "reviewee_id",
            name="uq_reviews_event_reviewer_reviewee",
        ),
    )
    op.create_index(op.f("ix_reviews_id"), "reviews", ["id"], unique=False)
    op.create_index(op.f("ix_reviews_event_id"), "reviews", ["event_id"], unique=False)
    op.create_index(
        op.f("ix_reviews_reviewer_id"), "reviews", ["reviewer_id"], unique=False
    )
    op.create_index(
        "ix_reviews_reviewee_role",
        "reviews",
        ["reviewee_id", "target_role"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_reviews_reviewee_role", table_name="reviews")
    op.drop_index(op.f("ix_reviews_reviewer_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_event_id"), table_name="reviews")
    op.drop_index(op.f("ix_reviews_id"), table_name="reviews")
    op.drop_table("reviews")

    op.drop_column("users", "rating_as_organizer_count")
    op.drop_column("users", "rating_as_player_count")

    op.drop_index(op.f("ix_events_end_datetime"), table_name="events")
    op.alter_column(
        "events",
        "end_datetime",
        existing_type=sa.DateTime(timezone=True),
        nullable=True,
    )
