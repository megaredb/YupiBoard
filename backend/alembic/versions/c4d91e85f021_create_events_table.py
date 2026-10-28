"""Create events table with cube and earthdistance extensions.

Revision ID: c4d91e85f021
Revises: 917ac3a28855
Create Date: 2026-10-28 16:50:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "c4d91e85f021"
down_revision: str | Sequence[str] | None = "917ac3a28855"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS cube")
    op.execute("CREATE EXTENSION IF NOT EXISTS earthdistance")

    op.create_table(
        "events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("organizer_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("game_title", sa.String(length=150), nullable=False),
        sa.Column("address", sa.String(length=255), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lon", sa.Float(), nullable=False),
        sa.Column("start_datetime", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column("min_players", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("max_players", sa.Integer(), nullable=False),
        sa.Column(
            "current_confirmed", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("entry_cost", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("photo_url", sa.String(length=2048), nullable=True),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="OnModeration",
        ),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column(
            "is_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
        sa.Column("promoted_to_datetime", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")
        ),
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
            "min_players >= 1 AND min_players <= 20", name="ck_events_min_players_range"
        ),
        sa.CheckConstraint(
            "max_players >= 1 AND max_players <= 20", name="ck_events_max_players_range"
        ),
        sa.CheckConstraint("min_players <= max_players", name="ck_events_player_range"),
        sa.CheckConstraint(
            "current_confirmed >= 0", name="ck_events_current_confirmed_nonnegative"
        ),
        sa.CheckConstraint("entry_cost >= 0", name="ck_events_entry_cost_nonnegative"),
        sa.CheckConstraint("lat >= -90 AND lat <= 90", name="ck_events_lat_range"),
        sa.CheckConstraint("lon >= -180 AND lon <= 180", name="ck_events_lon_range"),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_events_id"), "events", ["id"], unique=False)
    op.create_index(
        op.f("ix_events_organizer_id"), "events", ["organizer_id"], unique=False
    )
    op.create_index(op.f("ix_events_city"), "events", ["city"], unique=False)
    op.create_index(
        op.f("ix_events_start_datetime"), "events", ["start_datetime"], unique=False
    )
    op.create_index(op.f("ix_events_status"), "events", ["status"], unique=False)
    op.create_index(
        op.f("ix_events_is_deleted"), "events", ["is_deleted"], unique=False
    )
    op.execute(
        "CREATE INDEX ix_events_earth_distance ON events USING gist (ll_to_earth(lat, lon))"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_events_earth_distance")
    op.drop_table("events")
    op.execute("DROP EXTENSION IF EXISTS earthdistance")
    op.execute("DROP EXTENSION IF EXISTS cube")
