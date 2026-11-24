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
from app.core.realtime import RealtimeBroker, realtime_broker
from app.modules.bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    BLOCKED_BOOKING_STATUSES,
    Booking,
    BookingStatus,
)
from app.modules.bookings.repository import BookingRepository
from app.modules.events.models import (
    NOT_HELD_EVENT_STATUSES,
    REVIEW_WINDOW,
    Event,
    EventStatus,
)
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
        realtime: RealtimeBroker | None = None,
    ) -> None:
        self.booking_repo = booking_repo
        self.event_repo = event_repo
        self.notification_service = notification_service
        self.realtime = realtime if realtime is not None else realtime_broker

    async def _publish_event_update(self, event: Event) -> None:
        await self.realtime.publish_event_update(
            event.id,
            "event.updated",
            {
                "event_id": str(event.id),
                "status": event.status.value,
                "current_confirmed": event.current_confirmed,
                "available_seats": max(0, event.max_players - event.current_confirmed),
                "is_verified": event.is_verified,
            },
        )

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
            if existing_active.status == BookingStatus.REJECTED:
                raise ForbiddenException(
                    "Your application for this event was rejected "
                    "and you cannot apply again"
                )
            if existing_active.status in BLOCKED_BOOKING_STATUSES:
                raise ForbiddenException(
                    "You have been disqualified from this event and cannot apply again"
                )
            raise ConflictException(
                "Active booking request already exists for this event"
            )

        if event.current_confirmed >= event.max_players:
            booking = await self.booking_repo.create_booking(
                event_id=event.id,
                user_id=player.id,
                status=BookingStatus.WAITLIST,
            )
            if self.notification_service is not None:
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=player.id,
                        notification_type=NotificationType.WAITLIST_PROMOTED,
                        title="Added to Waitlist",
                        message=f"The table for {event.title} is currently full. You have been added to the waitlist.",
                        metadata_payload={
                            "event_id": str(event.id),
                            "booking_id": str(booking.id),
                        },
                    )
                )
            await self._publish_event_update(event)
            return booking

        # Booking starts as Pending for organizer review
        booking = await self.booking_repo.create_booking(
            event_id=event.id,
            user_id=player.id,
            status=BookingStatus.PENDING,
        )
        if self.notification_service is not None:
            await self._notify_booking_requested(event, booking, player)
        await self._publish_event_update(event)
        return booking

    async def _notify_booking_requested(
        self,
        event: Event,
        booking: Booking,
        player: User,
        *,
        from_waitlist: bool = False,
    ) -> None:
        if self.notification_service is None:
            return
        await self.notification_service.notify(
            NotificationCreate(
                user_id=event.organizer_id,
                notification_type=NotificationType.BOOKING_REQUESTED,
                title="New Booking Request",
                message=f"{_display_name(player)} requested a seat at {event.title}.",
                metadata_payload={
                    "event_id": str(event.id),
                    "booking_id": str(booking.id),
                    **({"from_waitlist": True} if from_waitlist else {}),
                },
            )
        )

    async def _promote_from_waitlist(self, event: Event) -> None:
        """A seat was freed. A waitlisted player the organizer already accepted
        takes it straight away; otherwise the oldest waitlisted player goes back
        to Pending so the organizer can decide on them."""
        waiting = await self.booking_repo.get_first_waitlisted(event.id)
        if waiting is None:
            return
        if waiting.is_preapproved and event.current_confirmed < event.max_players:
            await self._confirm_preapproved(event, waiting)
            return
        promoted = await self.booking_repo.update(waiting, status=BookingStatus.PENDING)
        await self._notify_booking_requested(
            event, promoted, promoted.user, from_waitlist=True
        )

    async def _confirm_preapproved(self, event: Event, booking: Booking) -> None:
        await self.event_repo.update(
            event, current_confirmed=event.current_confirmed + 1
        )
        await self.booking_repo.update(
            booking, status=BookingStatus.CONFIRMED, is_preapproved=False
        )
        if self.notification_service is None:
            return
        organizer = await self.booking_repo.session.get(User, event.organizer_id)
        host_name = _display_name(organizer) if organizer is not None else ""
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
                    "host_name": host_name,
                    "from_waitlist": True,
                },
            )
        )

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
        reason: str | None = None,
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
            clean_reason = reason.strip() if reason and reason.strip() else None
            meta = {
                "event_id": str(event.id),
                "booking_id": str(booking.id),
                "event_title": event.title,
                **({"reason": clean_reason} if clean_reason else {}),
            }
            if booking.status == BookingStatus.CONFIRMED:
                await self.event_repo.update(
                    event, current_confirmed=max(0, event.current_confirmed - 1)
                )
                updated = (
                    await self.booking_repo.update(
                        booking,
                        status=BookingStatus.REMOVED_BY_ORGANIZER,
                        rejection_reason=clean_reason,
                    )
                    if clean_reason is not None
                    else await self.booking_repo.update(
                        booking, status=BookingStatus.REMOVED_BY_ORGANIZER
                    )
                )
                if self.notification_service is not None:
                    msg = f"The organizer has removed your confirmed seat for {event.title}."
                    if clean_reason:
                        msg = f"{msg} Reason: {clean_reason}"
                    await self.notification_service.notify(
                        NotificationCreate(
                            user_id=booking.user_id,
                            notification_type=NotificationType.BOOKING_REMOVED_BY_ORGANIZER,
                            title="Removed from Event",
                            message=msg,
                            metadata_payload=meta,
                        )
                    )
                await self._promote_from_waitlist(event)
                await self._publish_event_update(event)
                return updated
            if booking.status not in (BookingStatus.PENDING, BookingStatus.WAITLIST):
                raise BadRequestException(
                    "Only pending, waitlisted or confirmed bookings can be declined"
                )
            updated = (
                await self.booking_repo.update(
                    booking,
                    status=BookingStatus.REJECTED,
                    rejection_reason=clean_reason,
                )
                if clean_reason is not None
                else await self.booking_repo.update(
                    booking, status=BookingStatus.REJECTED
                )
            )
            if self.notification_service is not None:
                msg = f"Your booking request for {event.title} was declined by the organizer."
                if clean_reason:
                    msg = f"{msg} Reason: {clean_reason}"
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=booking.user_id,
                        notification_type=NotificationType.BOOKING_REJECTED,
                        title="Application Declined",
                        message=msg,
                        metadata_payload=meta,
                    )
                )
            await self._publish_event_update(event)
            return updated
        is_open_waitlist = (
            booking.status == BookingStatus.WAITLIST and not booking.is_preapproved
        )
        if booking.status != BookingStatus.PENDING and not is_open_waitlist:
            raise BadRequestException(
                "Only pending or not yet accepted waitlisted bookings can be approved"
            )
        if event.current_confirmed >= event.max_players:
            updated = await self.booking_repo.update(
                booking, status=BookingStatus.WAITLIST, is_preapproved=True
            )
            await self._publish_event_update(event)
            if self.notification_service is not None:
                await self.notification_service.notify(
                    NotificationCreate(
                        user_id=booking.user_id,
                        notification_type=NotificationType.WAITLIST_PROMOTED,
                        title="Added to Waitlist",
                        message=(
                            f"The table for {event.title} is currently full. "
                            "The organizer accepted your request: you will get "
                            "the next free seat automatically."
                        ),
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
            booking, status=BookingStatus.CONFIRMED, is_preapproved=False
        )
        await self._publish_event_update(event)
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
        if booking is None or booking.status not in ACTIVE_BOOKING_STATUSES:
            raise NotFoundException("Active booking not found")
        was_confirmed = booking.status == BookingStatus.CONFIRMED
        if was_confirmed:
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
        if was_confirmed:
            await self._promote_from_waitlist(event)
        await self._publish_event_update(event)
        return updated

    async def mark_attendance(
        self,
        event_id: uuid.UUID,
        booking_id: uuid.UUID,
        organizer: User,
        attended: bool,
    ) -> Booking:
        event = await self.event_repo.get_by_id(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.organizer_id != organizer.id and not organizer.is_superuser:
            raise ForbiddenException("Only the event organizer can mark attendance")
        now = datetime.now(UTC)
        if (
            event.status in NOT_HELD_EVENT_STATUSES
            or now < event.start_datetime
            or now > event.review_deadline
        ):
            raise BadRequestException(
                "Attendance can only be marked after the event starts "
                "and within 48 hours after it ends"
            )
        booking = await self.booking_repo.get_by_id_for_event(booking_id, event_id)
        if booking is None:
            raise NotFoundException("Booking not found")

        new_status = BookingStatus.ATTENDED if attended else BookingStatus.NO_SHOW
        if booking.status == new_status:
            return booking
        if booking.status == BookingStatus.ATTENDED:
            raise ConflictException("Confirmed attendance cannot be revoked")
        if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.NO_SHOW):
            raise BadRequestException(
                "Attendance can only be marked for confirmed participants"
            )

        updated = await self.booking_repo.update(booking, status=new_status)
        if attended and self.notification_service is not None:
            if now >= event.end_datetime:
                hint = "You can now rate the organizer within 48 hours."
            else:
                hint = "You can rate the organizer once the event ends."
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=booking.user_id,
                    notification_type=NotificationType.ATTENDANCE_MARKED,
                    title="Attendance Confirmed",
                    message=f"Your attendance at {event.title} was confirmed. {hint}",
                    metadata_payload={
                        "event_id": str(event.id),
                        "booking_id": str(booking.id),
                        "review_deadline": event.review_deadline.isoformat(),
                    },
                )
            )
        await self._publish_event_update(event)
        return updated

    async def expire_unmarked_attendance(self, now: datetime) -> int:
        """After the review window closes, unmarked confirmed seats become NO_SHOW."""
        return await self.booking_repo.mark_unmarked_as_no_show(now - REVIEW_WINDOW)

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
