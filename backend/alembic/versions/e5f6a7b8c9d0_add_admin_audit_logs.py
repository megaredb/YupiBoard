"""add admin_audit_logs table

Revision ID: e5f6a7b8c9d0
Revises: a3f1c9e2b7d4
Create Date: 2026-11-24 00:25:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: str | Sequence[str] | None = "a3f1c9e2b7d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "admin_audit_logs",
        sa.Column("admin_id", sa.Uuid(), nullable=True),
        sa.Column("action_type", sa.String(length=50), nullable=False),
        sa.Column("target_entity", sa.String(length=50), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=False),
        sa.Column("justification_reason", sa.Text(), nullable=True),
        sa.Column(
            "executed_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_admin_audit_logs_id"), "admin_audit_logs", ["id"], unique=False
    )
    op.create_index(
        op.f("ix_admin_audit_logs_admin_id"),
        "admin_audit_logs",
        ["admin_id"],
        unique=False,
    )
    op.create_index(
        "ix_admin_audit_logs_target",
        "admin_audit_logs",
        ["target_entity", "target_id"],
        unique=False,
    )
    op.create_index(
        "ix_admin_audit_logs_executed_at",
        "admin_audit_logs",
        ["executed_at"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_admin_audit_logs_executed_at", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_target", table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_admin_id"), table_name="admin_audit_logs")
    op.drop_index(op.f("ix_admin_audit_logs_id"), table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
