from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.users.models import User


class EventStatus(StrEnum):
    ON_MODERATION = "OnModeration"
    REJECTED = "Rejected"
    PUBLISHED = "Published"
    ONGOING = "Ongoing"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class Event(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint(
            "min_players >= 1 AND min_players <= 20",
            name="ck_events_min_players_range",
        ),
        CheckConstraint(
            "max_players >= 1 AND max_players <= 20",
            name="ck_events_max_players_range",
        ),
        CheckConstraint("min_players <= max_players", name="ck_events_player_range"),
        CheckConstraint(
            "current_confirmed >= 0",
            name="ck_events_current_confirmed_nonnegative",
        ),
        CheckConstraint("entry_cost >= 0", name="ck_events_entry_cost_nonnegative"),
        CheckConstraint("lat >= -90 AND lat <= 90", name="ck_events_lat_range"),
        CheckConstraint("lon >= -180 AND lon <= 180", name="ck_events_lon_range"),
    )

    organizer_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    game_title: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    start_datetime: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )
    end_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    min_players: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_players: Mapped[int] = mapped_column(Integer, nullable=False)
    current_confirmed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    entry_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
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
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    promoted_to_datetime: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, default=False, index=True, nullable=False
    )

    organizer: Mapped[User] = relationship("User")
