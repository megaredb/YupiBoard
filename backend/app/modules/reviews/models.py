from __future__ import annotations

import uuid
from enum import StrEnum
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    Connection,
    Enum,
    ForeignKey,
    Index,
    SmallInteger,
    UniqueConstraint,
    event,
    func,
    select,
    update,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.users.models import User


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


RATING_COLUMNS = {
    ReviewTargetRole.ORGANIZER: ("rating_as_organizer", "rating_as_organizer_count"),
    ReviewTargetRole.PLAYER: ("rating_as_player", "rating_as_player_count"),
}


@event.listens_for(Review, "after_insert")
@event.listens_for(Review, "after_update")
@event.listens_for(Review, "after_delete")
def refresh_reviewee_rating(
    _mapper: Any, connection: Connection, review: Review
) -> None:
    """Keeps the reviewee's average and count in step with their review rows, whoever
    writes them (the review API, the seed, tests). Runs in the same transaction."""
    rating_column, count_column = RATING_COLUMNS[ReviewTargetRole(review.target_role)]
    same_reviews = (
        Review.reviewee_id == review.reviewee_id,
        Review.target_role == review.target_role,
    )
    connection.execute(
        update(User)
        .where(User.id == review.reviewee_id)
        .values(
            {
                rating_column: select(func.round(func.avg(Review.score), 2))
                .where(*same_reviews)
                .scalar_subquery(),
                count_column: select(func.count(Review.id))
                .where(*same_reviews)
                .scalar_subquery(),
            }
        )
    )
