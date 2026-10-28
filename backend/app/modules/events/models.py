from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import TYPE_CHECKING

from geoalchemy2 import Geography, Geometry
from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    cast,
    func,
)
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.event_applications.models import EventApplication
    from app.modules.users.models import User


class EventStatus(StrEnum):
    ON_MODERATION = "OnModeration"
    PUBLISHED = "Published"
    CANCELLED = "Cancelled"
    COMPLETED = "Completed"
    HIDDEN = "Hidden"


class Event(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "events"
    __table_args__ = (
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
    location: Mapped[object] = mapped_column(
        Geography(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=False,
    )
    lat: Mapped[float] = column_property(func.ST_Y(cast(location, Geometry)))
    lon: Mapped[float] = column_property(func.ST_X(cast(location, Geometry)))
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
