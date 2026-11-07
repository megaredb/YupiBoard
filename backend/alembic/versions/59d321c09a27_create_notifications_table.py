"""create_notifications_table

Revision ID: 59d321c09a27
Revises: c8a7f6c2419f
Create Date: 2026-11-07 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "59d321c09a27"
down_revision: str | Sequence[str] | None = "c8a7f6c2419f"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "notifications",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column(
            "notification_type",
            sa.Enum(
                "BOOKING_REQUESTED",
                "BOOKING_APPROVED",
                "BOOKING_REJECTED",
                "BOOKING_CANCELLED_BY_PLAYER",
                "BOOKING_REMOVED_BY_ORGANIZER",
                "WAITLIST_PROMOTED",
                "EVENT_APPROVED",
                "EVENT_REJECTED",
                "REMINDER_24H",
                "REMINDER_2H",
                "EVENT_UPDATED",
                "EVENT_CANCELLED",
                "NEW_EVENT_FROM_FOLLOWED",
                "REVIEW_REMINDER",
                name="notification_type",
                native_enum=False,
                length=50,
            ),
            nullable=False,
        ),
        sa.Column("title", sa.String(length=150), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column(
            "is_read", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "metadata_payload",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.create_index(
        "ix_notifications_user_created",
        "notifications",
        ["user_id", sa.text("created_at DESC")],
        unique=False,
    )
    op.create_index(
        "ix_notifications_user_unread",
        "notifications",
        ["user_id"],
        unique=False,
        postgresql_where=sa.text("is_read = false"),
    )
    op.create_index(
        "ix_notifications_metadata_payload",
        "notifications",
        ["metadata_payload"],
        unique=False,
        postgresql_using="gin",
        postgresql_ops={"metadata_payload": "jsonb_path_ops"},
    )
    op.create_index(
        "ix_notifications_created_at", "notifications", ["created_at"], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_notifications_created_at", table_name="notifications")
    op.drop_index(
        "ix_notifications_metadata_payload",
        table_name="notifications",
        postgresql_using="gin",
    )
    op.drop_index("ix_notifications_user_unread", table_name="notifications")
    op.drop_index("ix_notifications_user_created", table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")
