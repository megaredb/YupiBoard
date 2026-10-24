"""Create events, applications, and ratings tables."""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "81f2ca0b43d1"
down_revision: str | Sequence[str] | None = "0e755bac67b7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("organizer_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("game_title", sa.String(length=255), nullable=False),
        sa.Column("address", sa.String(length=512), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("city", sa.String(length=255), nullable=False),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("min_players", sa.Integer(), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
        sa.Column("entry_cost", sa.Float(), nullable=False),
        sa.Column("photo_url", sa.String(length=2048), nullable=True),
        sa.Column("status", sa.String(length=12), nullable=False),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False),
        sa.Column("promoted_to_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_deleted", sa.Boolean(), nullable=False),
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
        sa.CheckConstraint("lat >= -90 AND lat <= 90", name="ck_events_lat_range"),
        sa.CheckConstraint("lon >= -180 AND lon <= 180", name="ck_events_lon_range"),
        sa.CheckConstraint("min_players <= max_players", name="ck_events_player_range"),
        sa.CheckConstraint("entry_cost >= 0", name="ck_events_entry_cost_nonnegative"),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(
        op.f("ix_events_organizer_id"), "events", ["organizer_id"], unique=False
    )
    op.create_index(op.f("ix_events_city"), "events", ["city"], unique=False)
    op.create_index(
        op.f("ix_events_start_datetime"),
        "events",
        ["start_datetime"],
        unique=False,
    )
    op.create_index(op.f("ix_events_status"), "events", ["status"], unique=False)
    op.create_index(
        op.f("ix_events_is_deleted"), "events", ["is_deleted"], unique=False
    )

    op.create_table(
        "event_applications",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("status", sa.String(length=9), nullable=False),
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
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "event_id", "user_id", name="uq_event_applications_event_user"
        ),
    )
    op.create_index(
        op.f("ix_event_applications_id"), "event_applications", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_event_applications_event_id"),
        "event_applications",
        ["event_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_event_applications_user_id"),
        "event_applications",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "event_ratings",
        sa.Column("event_id", sa.Uuid(), nullable=False),
        sa.Column("organizer_id", sa.Uuid(), nullable=False),
        sa.Column("reviewer_id", sa.Uuid(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=1000), nullable=True),
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
        sa.CheckConstraint(
            "score >= 1 AND score <= 5", name="ck_event_ratings_score_range"
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "event_id", "reviewer_id", name="uq_event_ratings_event_reviewer"
        ),
    )
    op.create_index(op.f("ix_event_ratings_id"), "event_ratings", ["id"], unique=False)
    op.create_index(
        op.f("ix_event_ratings_event_id"), "event_ratings", ["event_id"], unique=False
    )
    op.create_index(
        op.f("ix_event_ratings_organizer_id"),
        "event_ratings",
        ["organizer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_event_ratings_reviewer_id"),
        "event_ratings",
        ["reviewer_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_event_ratings_reviewer_id"), table_name="event_ratings")
    op.drop_index(op.f("ix_event_ratings_organizer_id"), table_name="event_ratings")
    op.drop_index(op.f("ix_event_ratings_event_id"), table_name="event_ratings")
    op.drop_index(op.f("ix_event_ratings_id"), table_name="event_ratings")
    op.drop_table("event_ratings")
    op.drop_index(
        op.f("ix_event_applications_user_id"), table_name="event_applications"
    )
    op.drop_index(
        op.f("ix_event_applications_event_id"), table_name="event_applications"
    )
    op.drop_index(op.f("ix_event_applications_id"), table_name="event_applications")
    op.drop_table("event_applications")
    op.drop_index(op.f("ix_events_is_deleted"), table_name="events")
    op.drop_index(op.f("ix_events_status"), table_name="events")
    op.drop_index(op.f("ix_events_start_datetime"), table_name="events")
    op.drop_index(op.f("ix_events_city"), table_name="events")
    op.drop_index(op.f("ix_events_organizer_id"), table_name="events")
    op.drop_index(op.f("ix_events_id"), table_name="events")
    op.drop_table("events")
