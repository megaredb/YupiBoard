from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.events.models import Event
    from app.modules.users.models import User


class EventRating(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "event_ratings"
    __table_args__ = (
        UniqueConstraint(
            "event_id", "reviewer_id", name="uq_event_ratings_event_reviewer"
        ),
        CheckConstraint(
            "score >= 1 AND score <= 5", name="ck_event_ratings_score_range"
        ),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    event: Mapped[Event] = relationship("Event")
    reviewer: Mapped[User] = relationship("User", foreign_keys=[reviewer_id])
