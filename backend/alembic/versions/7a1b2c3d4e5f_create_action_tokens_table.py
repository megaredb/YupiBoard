"""create action_tokens table

Revision ID: 7a1b2c3d4e5f
Revises: 2e2f5c1f3a90
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "7a1b2c3d4e5f"
down_revision: str | Sequence[str] | None = "2e2f5c1f3a90"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "action_tokens",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token_type", sa.String(length=50), nullable=False),
        sa.Column(
            "is_used",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
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
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_action_tokens_id"), "action_tokens", ["id"], unique=False)
    op.create_index(op.f("ix_action_tokens_jti"), "action_tokens", ["jti"], unique=True)
    op.create_index(
        op.f("ix_action_tokens_user_id"), "action_tokens", ["user_id"], unique=False
    )
    op.create_index(
        op.f("ix_action_tokens_token_type"),
        "action_tokens",
        ["token_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_action_tokens_token_type"), table_name="action_tokens")
    op.drop_index(op.f("ix_action_tokens_user_id"), table_name="action_tokens")
    op.drop_index(op.f("ix_action_tokens_jti"), table_name="action_tokens")
    op.drop_index(op.f("ix_action_tokens_id"), table_name="action_tokens")
    op.drop_table("action_tokens")
