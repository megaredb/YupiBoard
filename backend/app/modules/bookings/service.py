import uuid
from collections.abc import Sequence
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
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.schemas import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


def _display_name(user: User) -> str:
    if user.first_name and user.last_name:
        return f"{user.first_name} {user.last_name}"
    if user.first_name:
        return user.first_name
    return user.email.split("@")[0]


class BookingService:
    def __init__(
        self,
        booking_repo: BookingRepository,
        event_repo: EventRepository,
        notification_service: NotificationService | None = None,
    ) -> None:
        self.booking_repo = booking_repo
        self.event_repo = event_repo
        self.notification_service = notification_service

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
        booking = await self.booking_repo.create_booking(
            event_id=event.id,
            user_id=player.id,
            status=BookingStatus.PENDING,
        )
        if self.notification_service is not None:
            player_name = _display_name(player)
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=event.organizer_id,
                    notification_type=NotificationType.BOOKING_REQUESTED,
                    title="New Booking Request",
                    message=f"{player_name} requested a seat at {event.title}.",
                    metadata_payload={
                        "event_id": str(event.id),
                        "booking_id": str(booking.id),
                    },
                )
            )
        return booking

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        page: int,
        limit: int,
        status: BookingStatus | None = None,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ):
        return await self.booking_repo.list_for_user(
            user_id, page, limit, status=status, sort_by=sort_by, sort_order=sort_order
        )

    async def list_for_event(
        self,
        event_id: uuid.UUID,
        user: User,
        page: int,
        limit: int,
        status: BookingStatus | None = None,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ):
        event = await self.event_repo.get_by_id(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.organizer_id != user.id and not user.is_superuser:
            raise ForbiddenException("Only the event organizer can view event bookings")
        return await self.booking_repo.list_for_event(
            event_id, page, limit, status=status, sort_by=sort_by, sort_order=sort_order
        )

    async def decide(
        self,
        event_id: uuid.UUID,
        booking_id: uuid.UUID,
        organizer: User,
        approve: bool,
    ) -> Booking:
        event = await self.event_repo.lock_event(event_id)
        if event is None:
            raise NotFoundException("Event not found")
        if event.organizer_id != organizer.id and not organizer.is_superuser:
            raise ForbiddenException("Only the event organizer can decide on bookings")
        if event.start_datetime <= datetime.now(UTC):
            raise BadRequestException("Booking changes are closed after the start time")
        booking = await self.booking_repo.get_by_id_for_event(booking_id, event_id)
        if booking is None:
            raise NotFoundException("Booking not found")
        if not approve:
            if booking.status == BookingStatus.CONFIRMED:
                await self.event_repo.update(
                    event, current_confirmed=max(0, event.current_confirmed - 1)
                )
                updated = await self.booking_repo.update(
                    booking, status=BookingStatus.REMOVED_BY_ORGANIZER
                )
                if self.notification_service is not None:
                    await self.notification_service.notify(
                        NotificationCreate(
                            user_id=booking.user_id,
                            notification_type=NotificationType.BOOKING_REMOVED_BY_ORGANIZER,
                            title="Removed from Event",
                            message=f"The organizer has removed your confirmed seat for {event.title}.",
                            metadata_payload={
                                "event_id": str(event.id),
                                "booking_id": str(booking.id),
                            },
                        )
                    )
                return updated
            if booking.status != BookingStatus.PENDING:
                raise BadRequestException(
                    "Only pending or confirmed bookings can be declined"
                )
            updated = await self.booking_repo.update(
                booking, status=BookingStatus.REJECTED
            )
            if self.notification_service is not None:
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=booking.user_id,
                        notification_type=NotificationType.BOOKING_REJECTED,
                        title="Application Declined",
                        message=f"Your booking request for {event.title} was declined by the organizer.",
                        metadata_payload={
                            "event_id": str(event.id),
                            "booking_id": str(booking.id),
                        },
                    )
                )
            return updated
        if booking.status != BookingStatus.PENDING:
            raise BadRequestException("Only pending bookings can be decided")
        if event.current_confirmed >= event.max_players:
            updated = await self.booking_repo.update(
                booking, status=BookingStatus.WAITLIST
            )
            if self.notification_service is not None:
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=booking.user_id,
                        notification_type=NotificationType.WAITLIST_PROMOTED,
                        title="Added to Waitlist",
                        message=f"The table for {event.title} is currently full. You have been added to the waitlist.",
                        metadata_payload={
                            "event_id": str(event.id),
                            "booking_id": str(booking.id),
                        },
                    )
                )
            return updated
        await self.event_repo.update(
            event, current_confirmed=event.current_confirmed + 1
        )
        updated = await self.booking_repo.update(
            booking, status=BookingStatus.CONFIRMED
        )
        if self.notification_service is not None:
            host_name = _display_name(organizer)
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=booking.user_id,
                    notification_type=NotificationType.BOOKING_APPROVED,
                    title="Application Approved",
                    message=(
                        f"Great news! Host {host_name} has approved your "
                        "booking request. Your seat is confirmed."
                    ),
                    metadata_payload={
                        "event_id": str(event.id),
                        "booking_id": str(booking.id),
                    },
                )
            )
        return updated

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
        updated = await self.booking_repo.update(
            booking, status=BookingStatus.CANCELLED_BY_PLAYER
        )
        if self.notification_service is not None:
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=event.organizer_id,
                    notification_type=NotificationType.BOOKING_CANCELLED_BY_PLAYER,
                    title="Booking Cancelled",
                    message=f"A player cancelled their booking for {event.title}.",
                    metadata_payload={
                        "event_id": str(event.id),
                        "booking_id": str(booking.id),
                    },
                )
            )
        return updated

    async def list_confirmed_participants(
        self, event_id: uuid.UUID, viewer: User
    ) -> Sequence[User]:
        event = await self.event_repo.get_by_id(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")

        is_host = event.organizer_id == viewer.id or viewer.is_superuser
        if not is_host:
            is_confirmed = await self.booking_repo.is_confirmed_participant(
                event_id, viewer.id
            )
            if not is_confirmed:
                raise ForbiddenException(
                    "Participants list is only visible to confirmed players and event host"
                )

        return await self.booking_repo.get_confirmed_participants(event_id)
