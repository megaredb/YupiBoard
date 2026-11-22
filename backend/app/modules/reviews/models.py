from __future__ import annotations

import uuid
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    Enum,
    ForeignKey,
    Index,
    SmallInteger,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, TimestampMixin, UUIDMixin


class ReviewTargetRole(StrEnum):
    """Which of the reviewee's ratings the review counts towards."""

    PLAYER = "Player"
    ORGANIZER = "Organizer"


class Review(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint("score BETWEEN 1 AND 5", name="ck_reviews_score_range"),
        CheckConstraint("reviewer_id <> reviewee_id", name="ck_reviews_not_self"),
        UniqueConstraint(
            "event_id",
            "reviewer_id",
            "reviewee_id",
            name="uq_reviews_event_reviewer_reviewee",
        ),
        Index("ix_reviews_reviewee_role", "reviewee_id", "target_role"),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    target_role: Mapped[ReviewTargetRole] = mapped_column(
        Enum(
            ReviewTargetRole,
            name="review_target_role",
            native_enum=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=False,
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
