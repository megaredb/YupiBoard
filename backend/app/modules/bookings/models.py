from __future__ import annotations

import uuid
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.events.models import Event
    from app.modules.users.models import User


class BookingStatus(StrEnum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    REJECTED = "Rejected"
    WAITLIST = "Waitlist"
    CANCELLED_BY_PLAYER = "CancelledByPlayer"
    CANCELLED_BY_SYSTEM = "CancelledBySystem"
    REMOVED_BY_ORGANIZER = "RemovedByOrganizer"
    ATTENDED = "Attended"
    NO_SHOW = "NoShow"


ACTIVE_BOOKING_STATUSES = {
    BookingStatus.PENDING,
    BookingStatus.CONFIRMED,
    BookingStatus.WAITLIST,
}


class Booking(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_event_user", "event_id", "user_id"),
        Index("ix_bookings_event_status", "event_id", "status"),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[BookingStatus] = mapped_column(
        Enum(
            BookingStatus,
            name="booking_status",
            native_enum=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=BookingStatus.PENDING,
        index=True,
        nullable=False,
    )

    event: Mapped[Event] = relationship("Event")
    user: Mapped[User] = relationship("User")
