import uuid
from datetime import UTC, datetime
from typing import Literal

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

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        page: int,
        limit: int,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ):
        return await self.booking_repo.list_for_user(
            user_id, page, limit, sort_by, sort_order
        )

    async def list_for_event(
        self,
        event_id: uuid.UUID,
        organizer_id: uuid.UUID,
        page: int,
        limit: int,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ):
        event = await self.event_repo.get_owned_event(event_id, organizer_id)
        if event is None:
            raise NotFoundException("Event not found")
        return await self.booking_repo.list_for_event(
            event_id, page, limit, sort_by, sort_order
        )

    async def decide(
        self,
        event_id: uuid.UUID,
        booking_id: uuid.UUID,
        organizer: User,
        approve: bool,
    ) -> Booking:
        event = await self.event_repo.get_owned_event(event_id, organizer.id)
        if event is None:
            raise NotFoundException("Event not found")
        if event.start_datetime <= datetime.now(UTC):
            raise BadRequestException("Booking changes are closed after the start time")
        booking = await self.booking_repo.get_by_id_for_event(booking_id, event_id)
        if booking is None:
            raise NotFoundException("Booking not found")
        if booking.status != BookingStatus.PENDING:
            raise BadRequestException("Only pending bookings can be decided")
        if not approve:
            return await self.booking_repo.update(booking, status=BookingStatus.REJECTED)
        if event.current_confirmed >= event.max_players:
            return await self.booking_repo.update(booking, status=BookingStatus.WAITLIST)
        await self.event_repo.update(
            event, current_confirmed=event.current_confirmed + 1
        )
        return await self.booking_repo.update(booking, status=BookingStatus.CONFIRMED)

    async def cancel_for_player(
        self, event_id: uuid.UUID, player_id: uuid.UUID
    ) -> Booking:
        event = await self.event_repo.lock_event(event_id)
        if event is None:
            raise NotFoundException("Event not found")
        if event.start_datetime <= datetime.now(UTC):
            raise BadRequestException(
                "Registration cancellation is closed after the start time"
            )
        booking = await self.booking_repo.get_active_booking(event_id, player_id)
        if booking is None:
            raise NotFoundException("Active booking not found")
        if booking.status == BookingStatus.CONFIRMED:
            # probably bad idea who cares anyway
            await self.event_repo.update(
                event, current_confirmed=max(0, event.current_confirmed - 1)
            )
        return await self.booking_repo.update(
            booking, status=BookingStatus.CANCELLED_BY_PLAYER
        )
