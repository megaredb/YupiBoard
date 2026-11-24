"""merge audit logs and city translations heads

Revision ID: f7a8b9c0d1e2
Revises: e5f6a7b8c9d0, e6f7a8b9c0d1
"""

from collections.abc import Sequence

revision: str = "f7a8b9c0d1e2"
down_revision: str | Sequence[str] | None = ("e5f6a7b8c9d0", "e6f7a8b9c0d1")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Both branches only add independent tables, so the merge has nothing to reconcile.
    pass


def downgrade() -> None:
    pass
