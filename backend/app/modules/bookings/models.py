from __future__ import annotations

import uuid
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Enum, ForeignKey, Index, String, false, func, select
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin
from app.modules.users.models import User

if TYPE_CHECKING:
    from app.modules.events.models import Event


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

# Players that hold (or held) a seat: listed as participants of the event.
SEATED_BOOKING_STATUSES = {
    BookingStatus.CONFIRMED,
    BookingStatus.ATTENDED,
}

BLOCKED_BOOKING_STATUSES = {
    BookingStatus.REJECTED,
    BookingStatus.REMOVED_BY_ORGANIZER,
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
    rejection_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # A waitlisted booking the organizer already accepted: it is confirmed
    # automatically when a seat frees up, instead of going back to Pending.
    is_preapproved: Mapped[bool] = mapped_column(
        Boolean, default=False, server_default=false(), nullable=False
    )

    event: Mapped[Event] = relationship("Event", lazy="selectin")
    user: Mapped[User] = relationship("User", lazy="selectin")


# Attached here because the user model cannot import bookings (it would be circular).
User.events_played_count = column_property(
    select(func.count(Booking.id))
    .where(Booking.user_id == User.id, Booking.status == BookingStatus.ATTENDED)
    .correlate_except(Booking)
    .scalar_subquery()
)
