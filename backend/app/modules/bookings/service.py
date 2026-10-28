import uuid
from datetime import UTC, datetime

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.repository import BookingRepository
from app.modules.events.models import EventStatus
from app.modules.events.repository import EventRepository
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


class BookingService:
    def __init__(
        self,
        booking_repo: BookingRepository,
        event_repo: EventRepository,
    ) -> None:
        self.booking_repo = booking_repo
        self.event_repo = event_repo

    async def apply_for_seat(self, event_id: uuid.UUID, player: User) -> Booking:
        if player.status == UserStatus.BANNED:
            raise ForbiddenException("Banned users cannot apply for events")

        # Row-level lock on event record enforces ACID capacity defense
        event = await self.event_repo.lock_event(event_id)
        if event is None:
            raise NotFoundException("Event not found")

        now = datetime.now(UTC)
        if (
            event.status != EventStatus.PUBLISHED
            or not event.is_verified
            or event.start_datetime <= now
        ):
            raise BadRequestException("Event registration is closed")

        if event.organizer_id == player.id:
            raise BadRequestException("Cannot book own event")

        existing_active = await self.booking_repo.get_active_booking(
            event.id, player.id
        )
        if existing_active is not None:
            raise ConflictException(
                "Active booking request already exists for this event"
            )

        if event.current_confirmed >= event.max_players:
            raise ConflictException("Table capacity is exhausted")

        # In Sprint 1, creates booking with status Pending for organizer review
        return await self.booking_repo.create_booking(
            event_id=event.id,
            user_id=player.id,
            status=BookingStatus.PENDING,
        )
