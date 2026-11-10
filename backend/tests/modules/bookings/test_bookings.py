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
async def test_apply_for_seat_rejects_full_table() -> None:
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
    booking_repo.get_active_booking.return_value = None

    with pytest.raises(ConflictException, match="Table capacity is exhausted"):
        await service.apply_for_seat(event.id, player)


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
        user_id, 1, 20, status=BookingStatus.CONFIRMED, sort_by="date", sort_order="desc"
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

