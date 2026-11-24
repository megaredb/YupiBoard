import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.main import app
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.service import BookingService
from app.modules.events.models import Event, EventStatus
from app.modules.notifications.enums import NotificationType
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


def test_booking_status_enums() -> None:
    assert BookingStatus.PENDING == "Pending"
    assert BookingStatus.CONFIRMED == "Confirmed"
    assert BookingStatus.REJECTED == "Rejected"
    assert BookingStatus.WAITLIST == "Waitlist"
    assert BookingStatus.CANCELLED_BY_PLAYER == "CancelledByPlayer"
    assert BookingStatus.CANCELLED_BY_SYSTEM == "CancelledBySystem"
    assert BookingStatus.REMOVED_BY_ORGANIZER == "RemovedByOrganizer"
    assert BookingStatus.ATTENDED == "Attended"
    assert BookingStatus.NO_SHOW == "NoShow"


def test_booking_routes_are_registered() -> None:
    paths = app.openapi()["paths"]
    assert "/api/v1/events/{event_id}/bookings" in paths
    assert "post" in paths["/api/v1/events/{event_id}/bookings"]
    assert "/api/v1/bookings/me" in paths
    assert "/api/v1/events/{event_id}/bookings/{booking_id}/approve" in paths
    assert "/api/v1/events/{event_id}/bookings/{booking_id}/reject" in paths
    assert "/api/v1/events/{event_id}/bookings/me" in paths
    assert "/api/v1/events/{event_id}/bookings/me/cancel" in paths
    assert "/api/v1/events/{event_id}/participants" in paths
    assert "/api/v1/events/{event_id}/bookings/{booking_id}/attendance" in paths


@pytest.mark.asyncio
async def test_apply_for_seat_rejects_banned_user() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    banned_user = User(
        id=uuid.uuid7(),
        email="banned@example.com",
        status=UserStatus.BANNED,
    )

    with pytest.raises(ForbiddenException, match="Banned users cannot apply"):
        await service.apply_for_seat(uuid.uuid7(), banned_user)


@pytest.mark.asyncio
async def test_apply_for_seat_rejects_non_existent_event() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    event_repo.lock_event.return_value = None
    service = BookingService(booking_repo, event_repo)

    user = User(
        id=uuid.uuid7(),
        email="player@example.com",
        status=UserStatus.ACTIVE,
    )

    with pytest.raises(NotFoundException, match="Event not found"):
        await service.apply_for_seat(uuid.uuid7(), user)


@pytest.mark.asyncio
async def test_apply_for_seat_rejects_closed_registration() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    player = User(
        id=uuid.uuid7(),
        email="player@example.com",
        status=UserStatus.ACTIVE,
    )

    # Event on moderation
    unverified_event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.ON_MODERATION,
        is_verified=False,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = unverified_event

    with pytest.raises(BadRequestException, match="registration is closed"):
        await service.apply_for_seat(unverified_event.id, player)

    # Event in past
    past_event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) - timedelta(hours=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = past_event

    with pytest.raises(BadRequestException, match="registration is closed"):
        await service.apply_for_seat(past_event.id, player)


@pytest.mark.asyncio
async def test_apply_for_seat_rejects_organizer_booking_own_event() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    user_id = uuid.uuid7()
    user = User(id=user_id, email="host@example.com", status=UserStatus.ACTIVE)

    event = Event(
        id=uuid.uuid7(),
        organizer_id=user_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = event

    with pytest.raises(BadRequestException, match="Cannot book own event"):
        await service.apply_for_seat(event.id, user)


@pytest.mark.asyncio
async def test_apply_for_seat_rejects_duplicate_active_booking() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    player_id = uuid.uuid7()
    player = User(id=player_id, email="player@example.com", status=UserStatus.ACTIVE)

    event = Event(
        id=uuid.uuid7(),
        organizer_id=uuid.uuid7(),
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    booking_repo.get_active_booking.return_value = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=player_id,
        status=BookingStatus.PENDING,
    )

    with pytest.raises(
        ConflictException, match="Active booking request already exists"
    ):
        await service.apply_for_seat(event.id, player)


@pytest.mark.asyncio
async def test_apply_for_seat_joins_waitlist_when_table_is_full() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )

    player = User(id=uuid.uuid7(), email="player@example.com", status=UserStatus.ACTIVE)

    event = Event(
        id=uuid.uuid7(),
        organizer_id=uuid.uuid7(),
        title="Catan night",
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=5,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    booking_repo.get_active_booking.return_value = None
    booking_repo.create_booking.return_value = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=player.id,
        status=BookingStatus.WAITLIST,
    )

    result = await service.apply_for_seat(event.id, player)

    assert result.status == BookingStatus.WAITLIST
    booking_repo.create_booking.assert_awaited_once_with(
        event_id=event.id, user_id=player.id, status=BookingStatus.WAITLIST
    )
    notification_service.notify.assert_awaited_once()
    sent = notification_service.notify.await_args.args[0]
    assert sent.user_id == player.id
    assert sent.notification_type == NotificationType.WAITLIST_PROMOTED


@pytest.mark.parametrize(
    ("status", "match"),
    [
        (BookingStatus.REJECTED, "rejected"),
        (BookingStatus.REMOVED_BY_ORGANIZER, "disqualified"),
    ],
)
@pytest.mark.asyncio
async def test_apply_for_seat_forbidden_after_rejection_or_removal(
    status: BookingStatus, match: str
) -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)
    player = User(id=uuid.uuid7(), email="player@example.com", status=UserStatus.ACTIVE)
    event = Event(
        id=uuid.uuid7(),
        organizer_id=uuid.uuid7(),
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=5,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    booking_repo.get_active_booking.return_value = Booking(
        id=uuid.uuid7(), event_id=event.id, user_id=player.id, status=status
    )

    with pytest.raises(ForbiddenException, match=match):
        await service.apply_for_seat(event.id, player)
    booking_repo.create_booking.assert_not_awaited()


def _waitlist_setup(
    *, waiting: bool
) -> tuple[BookingService, AsyncMock, AsyncMock, AsyncMock, Event, Booking | None]:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )
    event = Event(
        id=uuid.uuid7(),
        organizer_id=uuid.uuid7(),
        title="Catan night",
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=5,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    waiting_booking = None
    if waiting:
        waiting_booking = Booking(
            id=uuid.uuid7(),
            event_id=event.id,
            user_id=uuid.uuid7(),
            status=BookingStatus.WAITLIST,
        )
        waiting_booking.user = User(
            id=waiting_booking.user_id, email="wait@example.com", first_name="Wanda"
        )
    booking_repo.get_first_waitlisted.return_value = waiting_booking

    def _apply_update(obj: Booking, **kwargs: object) -> Booking:
        for key, value in kwargs.items():
            setattr(obj, key, value)
        return obj

    booking_repo.update.side_effect = _apply_update
    return (
        service,
        booking_repo,
        event_repo,
        notification_service,
        event,
        waiting_booking,
    )


@pytest.mark.asyncio
async def test_player_cancelling_confirmed_seat_promotes_waitlist() -> None:
    service, booking_repo, _, notifications, event, waiting = _waitlist_setup(
        waiting=True
    )
    player_id = uuid.uuid7()
    confirmed = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=player_id,
        status=BookingStatus.CONFIRMED,
    )
    booking_repo.get_active_booking.return_value = confirmed

    await service.cancel_for_player(event.id, player_id)

    assert waiting is not None
    assert waiting.status == BookingStatus.PENDING
    last = notifications.notify.await_args_list[-1].args[0]
    assert last.user_id == event.organizer_id
    assert last.notification_type == NotificationType.BOOKING_REQUESTED
    assert last.metadata_payload["from_waitlist"] is True
    assert last.metadata_payload["booking_id"] == str(waiting.id)


@pytest.mark.asyncio
async def test_organizer_removing_confirmed_seat_promotes_waitlist() -> None:
    service, booking_repo, _, notifications, event, waiting = _waitlist_setup(
        waiting=True
    )
    organizer = User(id=event.organizer_id, email="host@example.com")
    confirmed = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=uuid.uuid7(),
        status=BookingStatus.CONFIRMED,
    )
    booking_repo.get_by_id_for_event.return_value = confirmed

    await service.decide(event.id, confirmed.id, organizer, approve=False)

    assert waiting is not None
    assert waiting.status == BookingStatus.PENDING
    assert notifications.notify.await_count == 2


@pytest.mark.asyncio
async def test_freed_seat_without_waitlist_promotes_nobody() -> None:
    service, booking_repo, _, notifications, event, _ = _waitlist_setup(waiting=False)
    player_id = uuid.uuid7()
    booking_repo.get_active_booking.return_value = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=player_id,
        status=BookingStatus.CONFIRMED,
    )

    await service.cancel_for_player(event.id, player_id)

    # only the "player cancelled" notification, nothing for a promotion
    assert notifications.notify.await_count == 1


@pytest.mark.parametrize("status", [BookingStatus.PENDING, BookingStatus.WAITLIST])
@pytest.mark.asyncio
async def test_cancelling_non_confirmed_booking_does_not_promote(
    status: BookingStatus,
) -> None:
    service, booking_repo, event_repo, _, event, _ = _waitlist_setup(waiting=True)
    player_id = uuid.uuid7()
    booking_repo.get_active_booking.return_value = Booking(
        id=uuid.uuid7(), event_id=event.id, user_id=player_id, status=status
    )

    await service.cancel_for_player(event.id, player_id)

    booking_repo.get_first_waitlisted.assert_not_awaited()
    event_repo.update.assert_not_awaited()


@pytest.mark.asyncio
async def test_organizer_can_reject_waitlisted_booking() -> None:
    service, booking_repo, _, _, event, waiting = _waitlist_setup(waiting=True)
    organizer = User(id=event.organizer_id, email="host@example.com")
    booking_repo.get_by_id_for_event.return_value = waiting

    result = await service.decide(event.id, waiting.id, organizer, approve=False)

    assert result.status == BookingStatus.REJECTED
    booking_repo.get_first_waitlisted.assert_not_awaited()


@pytest.mark.asyncio
async def test_apply_for_seat_creates_pending_booking_successfully() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    player = User(id=uuid.uuid7(), email="player@example.com", status=UserStatus.ACTIVE)

    event = Event(
        id=uuid.uuid7(),
        organizer_id=uuid.uuid7(),
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=2,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    booking_repo.get_active_booking.return_value = None

    expected_booking = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=player.id,
        status=BookingStatus.PENDING,
    )
    booking_repo.create_booking.return_value = expected_booking

    result = await service.apply_for_seat(event.id, player)

    assert result.status == BookingStatus.PENDING
    assert result.event_id == event.id
    assert result.user_id == player.id
    booking_repo.create_booking.assert_called_once_with(
        event_id=event.id,
        user_id=player.id,
        status=BookingStatus.PENDING,
    )


@pytest.mark.asyncio
async def test_decide_rejects_non_organizer_with_forbidden() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    other_user = User(
        id=uuid.uuid7(),
        email="other@example.com",
        status=UserStatus.ACTIVE,
        is_superuser=False,
    )

    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = event

    with pytest.raises(ForbiddenException, match="Only the event organizer can decide"):
        await service.decide(
            event_id=event.id,
            booking_id=uuid.uuid7(),
            organizer=other_user,
            approve=True,
        )


@pytest.mark.asyncio
async def test_decide_allows_superuser() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    superuser = User(
        id=uuid.uuid7(),
        email="admin@example.com",
        status=UserStatus.ACTIVE,
        is_superuser=True,
    )

    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.lock_event.return_value = event
    booking = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=uuid.uuid7(),
        status=BookingStatus.PENDING,
    )
    booking_repo.get_by_id_for_event.return_value = booking
    booking_repo.update.return_value = booking

    await service.decide(
        event_id=event.id,
        booking_id=booking.id,
        organizer=superuser,
        approve=True,
    )
    event_repo.lock_event.assert_called_once_with(event.id)
    event_repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_list_for_event_rejects_non_organizer_with_forbidden() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    other_user = User(
        id=uuid.uuid7(),
        email="other@example.com",
        status=UserStatus.ACTIVE,
        is_superuser=False,
    )

    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        is_deleted=False,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=0,
        max_players=5,
    )
    event_repo.get_by_id.return_value = event

    with pytest.raises(ForbiddenException, match="Only the event organizer can view"):
        await service.list_for_event(
            event_id=event.id,
            user=other_user,
            page=1,
            limit=20,
        )


@pytest.mark.asyncio
async def test_list_confirmed_participants_access_control() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    host = User(id=organizer_id, email="host@example.com", status=UserStatus.ACTIVE)
    confirmed_player = User(
        id=uuid.uuid7(), email="player@example.com", status=UserStatus.ACTIVE
    )
    stranger = User(
        id=uuid.uuid7(), email="stranger@example.com", status=UserStatus.ACTIVE
    )

    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        is_deleted=False,
    )
    event_repo.get_by_id.return_value = event
    booking_repo.get_confirmed_participants.return_value = [confirmed_player]

    # Host can see confirmed participants
    res_host = await service.list_confirmed_participants(event.id, host)
    assert len(res_host) == 1

    # Confirmed player can see confirmed participants
    booking_repo.is_confirmed_participant.return_value = True
    res_player = await service.list_confirmed_participants(event.id, confirmed_player)
    assert len(res_player) == 1

    # Stranger (unconfirmed) gets 403 Forbidden
    booking_repo.is_confirmed_participant.return_value = False
    with pytest.raises(
        ForbiddenException,
        match="Participants list is only visible to confirmed players",
    ):
        await service.list_confirmed_participants(event.id, stranger)


@pytest.mark.asyncio
async def test_list_for_user_passes_status_filter() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    user_id = uuid.uuid7()
    booking_repo.list_for_user.return_value = ([], 0)

    await service.list_for_user(
        user_id=user_id,
        page=1,
        limit=20,
        status=BookingStatus.CONFIRMED,
        sort_by="date",
        sort_order="desc",
    )

    booking_repo.list_for_user.assert_awaited_once_with(
        user_id,
        1,
        20,
        status=BookingStatus.CONFIRMED,
        sort_by="date",
        sort_order="desc",
    )


@pytest.mark.asyncio
async def test_list_for_event_passes_status_filter() -> None:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    service = BookingService(booking_repo, event_repo)

    organizer_id = uuid.uuid7()
    host = User(id=organizer_id, email="host@example.com", status=UserStatus.ACTIVE)
    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        status=EventStatus.PUBLISHED,
        is_verified=True,
        is_deleted=False,
    )
    event_repo.get_by_id.return_value = event
    booking_repo.list_for_event.return_value = ([], 0)

    await service.list_for_event(
        event_id=event.id,
        user=host,
        page=1,
        limit=20,
        status=BookingStatus.PENDING,
        sort_by="name",
        sort_order="asc",
    )

    booking_repo.list_for_event.assert_awaited_once_with(
        event.id, 1, 20, status=BookingStatus.PENDING, sort_by="name", sort_order="asc"
    )


@pytest.mark.asyncio
async def test_decide_decline_confirmed_booking_removes_participant_and_notifies() -> (
    None
):
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )

    organizer_id = uuid.uuid7()
    organizer = User(
        id=organizer_id,
        email="host@example.com",
        first_name="Oleksii",
        last_name="Kovalenko",
        status=UserStatus.ACTIVE,
    )
    event = Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        title="Dune: Imperium Tournament Night",
        status=EventStatus.PUBLISHED,
        is_verified=True,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        current_confirmed=3,
        max_players=6,
    )
    event_repo.lock_event.return_value = event

    booking = Booking(
        id=uuid.uuid7(),
        event_id=event.id,
        user_id=uuid.uuid7(),
        status=BookingStatus.CONFIRMED,
    )
    booking_repo.get_by_id_for_event.return_value = booking
    booking_repo.get_first_waitlisted.return_value = None
    booking_repo.update.return_value = Booking(
        id=booking.id,
        event_id=event.id,
        user_id=booking.user_id,
        status=BookingStatus.REMOVED_BY_ORGANIZER,
    )

    result = await service.decide(
        event_id=event.id,
        booking_id=booking.id,
        organizer=organizer,
        approve=False,
    )

    assert result.status == BookingStatus.REMOVED_BY_ORGANIZER
    event_repo.update.assert_awaited_once_with(event, current_confirmed=2)
    booking_repo.update.assert_awaited_once_with(
        booking, status=BookingStatus.REMOVED_BY_ORGANIZER
    )
    notification_service.notify.assert_awaited_once()


def _held_event(
    organizer_id: uuid.UUID,
    *,
    start_offset: timedelta = timedelta(hours=-5),
    end_offset: timedelta = timedelta(hours=-1),
    status: EventStatus = EventStatus.COMPLETED,
) -> Event:
    now = datetime.now(UTC)
    return Event(
        id=uuid.uuid7(),
        organizer_id=organizer_id,
        title="Catan night",
        status=status,
        is_verified=True,
        is_deleted=False,
        start_datetime=now + start_offset,
        end_datetime=now + end_offset,
        current_confirmed=1,
        max_players=4,
    )


def _attendance_setup(
    event: Event, booking_status: BookingStatus
) -> tuple[BookingService, AsyncMock, AsyncMock, Booking]:
    booking_repo = AsyncMock()
    event_repo = AsyncMock()
    notification_service = AsyncMock()
    service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )
    booking = Booking(
        id=uuid.uuid7(), event_id=event.id, user_id=uuid.uuid7(), status=booking_status
    )
    event_repo.get_by_id.return_value = event
    booking_repo.get_by_id_for_event.return_value = booking
    booking_repo.update.side_effect = lambda b, **kw: Booking(
        id=b.id, event_id=b.event_id, user_id=b.user_id, status=kw["status"]
    )
    return service, booking_repo, notification_service, booking


@pytest.mark.asyncio
async def test_mark_attendance_sets_attended_and_notifies_player() -> None:
    from app.modules.notifications.enums import NotificationType

    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, booking_repo, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=True
    )

    assert result.status == BookingStatus.ATTENDED
    booking_repo.update.assert_awaited_once_with(booking, status=BookingStatus.ATTENDED)
    sent = notifications.notify.call_args.args[0]
    assert sent.user_id == booking.user_id
    assert sent.notification_type == NotificationType.ATTENDANCE_MARKED
    assert "rate the organizer within 48 hours" in sent.message


@pytest.mark.asyncio
async def test_mark_attendance_during_event_hints_rating_after_end() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(
        organizer.id,
        start_offset=timedelta(hours=-1),
        end_offset=timedelta(hours=2),
        status=EventStatus.ONGOING,
    )
    service, _, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    await service.mark_attendance(event.id, booking.id, organizer, attended=True)

    assert "once the event ends" in notifications.notify.call_args.args[0].message


@pytest.mark.asyncio
async def test_mark_attendance_no_show_does_not_notify() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, notifications, booking = _attendance_setup(
        event, BookingStatus.CONFIRMED
    )

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=False
    )

    assert result.status == BookingStatus.NO_SHOW
    notifications.notify.assert_not_awaited()


@pytest.mark.asyncio
async def test_mark_attendance_rejects_non_organizer() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    stranger = User(id=uuid.uuid7(), email="x@example.com", is_superuser=False)
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.CONFIRMED)

    with pytest.raises(ForbiddenException, match="Only the event organizer"):
        await service.mark_attendance(event.id, booking.id, stranger, attended=True)


@pytest.mark.parametrize(
    ("start_offset", "end_offset", "status"),
    [
        # not started yet
        (timedelta(hours=1), timedelta(hours=5), EventStatus.PUBLISHED),
        # window closed: ended more than 48h ago
        (timedelta(hours=-60), timedelta(hours=-49), EventStatus.COMPLETED),
        # event never took place
        (timedelta(hours=-5), timedelta(hours=-1), EventStatus.CANCELLED),
    ],
)
@pytest.mark.asyncio
async def test_mark_attendance_outside_window_is_rejected(
    start_offset: timedelta, end_offset: timedelta, status: EventStatus
) -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(
        organizer.id, start_offset=start_offset, end_offset=end_offset, status=status
    )
    service, _, _, booking = _attendance_setup(event, BookingStatus.CONFIRMED)

    with pytest.raises(BadRequestException, match="Attendance can only be marked"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=True)


@pytest.mark.asyncio
async def test_mark_attendance_cannot_revoke_attended() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.ATTENDED)

    with pytest.raises(ConflictException, match="cannot be revoked"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=False)


@pytest.mark.asyncio
async def test_mark_attendance_no_show_can_be_corrected_to_attended() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.NO_SHOW)

    result = await service.mark_attendance(
        event.id, booking.id, organizer, attended=True
    )
    assert result.status == BookingStatus.ATTENDED


@pytest.mark.asyncio
async def test_mark_attendance_rejects_unconfirmed_booking() -> None:
    organizer = User(id=uuid.uuid7(), email="org@example.com")
    event = _held_event(organizer.id)
    service, _, _, booking = _attendance_setup(event, BookingStatus.PENDING)

    with pytest.raises(BadRequestException, match="confirmed participants"):
        await service.mark_attendance(event.id, booking.id, organizer, attended=True)


@pytest.mark.asyncio
async def test_expire_unmarked_attendance_uses_48h_cutoff() -> None:
    booking_repo = AsyncMock()
    booking_repo.mark_unmarked_as_no_show.return_value = 3
    service = BookingService(booking_repo, AsyncMock())
    now = datetime.now(UTC)

    assert await service.expire_unmarked_attendance(now) == 3
    booking_repo.mark_unmarked_as_no_show.assert_awaited_once_with(
        now - timedelta(hours=48)
    )
