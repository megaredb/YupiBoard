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
    assert "/api/v1/events/{id}/bookings" in paths
    assert "post" in paths["/api/v1/events/{id}/bookings"]


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
