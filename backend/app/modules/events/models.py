import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.events.types import Longitude

if TYPE_CHECKING:
    from app.modules.users.models import User


class EventStatus(StrEnum):
    ON_MODERATION = "OnModeration"
    PUBLISHED = "Published"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"
    HIDDEN = "Hidden"


class ApplicationStatus(StrEnum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class Event(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("lat >= -90 AND lat <= 90", name="ck_events_lat_range"),
        CheckConstraint("lon >= -180 AND lon <= 180", name="ck_events_lon_range"),
        CheckConstraint("min_players <= max_players", name="ck_events_player_range"),
        CheckConstraint("entry_cost >= 0", name="ck_events_entry_cost_nonnegative"),
    )

    organizer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    game_title: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(String(512), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Longitude(), nullable=False)
    city: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    start_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    end_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    min_players: Mapped[int] = mapped_column(Integer, nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)
    entry_cost: Mapped[float] = mapped_column(Float, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    status: Mapped[EventStatus] = mapped_column(
        Enum(
            EventStatus,
            name="event_status",
            native_enum=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=EventStatus.ON_MODERATION,
        index=True,
        nullable=False,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    promoted_to_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(default=False, index=True, nullable=False)

    organizer: Mapped[User] = relationship("User")
    applications: Mapped[list[EventApplication]] = relationship(
        back_populates="event", cascade="all, delete-orphan"
    )


class EventApplication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "event_applications"
    __table_args__ = (
        UniqueConstraint(
            "event_id", "user_id", name="uq_event_applications_event_user"
        ),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(
            ApplicationStatus,
            name="event_application_status",
            native_enum=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=ApplicationStatus.PENDING,
        nullable=False,
    )

    event: Mapped[Event] = relationship(back_populates="applications")
    user: Mapped[User] = relationship("User")


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
    organizer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reviewer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(String(1000), nullable=True)
