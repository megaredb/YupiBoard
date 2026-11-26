import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.service import BookingService
from app.modules.events.models import Event, EventStatus
from app.modules.users.models import User


def _user(session: AsyncSession) -> User:
    user = User(email=f"close_{uuid.uuid7().hex}@example.com", hashed_password="x")
    session.add(user)
    return user


def _event(session: AsyncSession, organizer: User, starts_in: timedelta) -> Event:
    start = datetime.now(UTC) + starts_in
    event = Event(
        organizer_id=organizer.id,
        title="Waitlist closing",
        description="Test event",
        game_title="Catan",
        address="Main street 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=start,
        end_datetime=start + timedelta(hours=4),
        max_players=2,
        current_confirmed=1,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,
        is_verified=True,
    )
    session.add(event)
    return event


@pytest.mark.asyncio
async def test_close_open_requests_delegates_to_repository() -> None:
    booking_repo = AsyncMock()
    booking_repo.close_open_requests_of_started_events.return_value = 2
    service = BookingService(booking_repo, AsyncMock())
    now = datetime.now(UTC)

    assert await service.close_open_requests(now) == 2
    booking_repo.close_open_requests_of_started_events.assert_awaited_once_with(now)


@pytest.mark.asyncio
async def test_started_events_lose_pending_and_waitlist_bookings(
    db_session: AsyncSession,
) -> None:
    # Shares the development database: everything here is rolled back at the end.
    organizer, confirmed, pending, waiting, upcoming_waiting = (
        _user(db_session) for _ in range(5)
    )
    await db_session.flush()
    started = _event(db_session, organizer, -timedelta(minutes=5))
    upcoming = _event(db_session, organizer, timedelta(days=1))
    await db_session.flush()

    def book(event: Event, user: User, status: BookingStatus) -> Booking:
        booking = Booking(
            event_id=event.id,
            user_id=user.id,
            status=status,
            is_preapproved=status == BookingStatus.WAITLIST,
        )
        db_session.add(booking)
        return booking

    seat = book(started, confirmed, BookingStatus.CONFIRMED)
    request = book(started, pending, BookingStatus.PENDING)
    queued = book(started, waiting, BookingStatus.WAITLIST)
    still_open = book(upcoming, upcoming_waiting, BookingStatus.WAITLIST)
    await db_session.flush()

    closed = await BookingRepository(db_session).close_open_requests_of_started_events(
        datetime.now(UTC)
    )
    for booking in (seat, request, queued, still_open):
        await db_session.refresh(booking)

    assert closed >= 2
    assert seat.status == BookingStatus.CONFIRMED
    assert request.status == BookingStatus.CANCELLED_BY_SYSTEM
    assert queued.status == BookingStatus.CANCELLED_BY_SYSTEM
    assert queued.is_preapproved is False
    assert still_open.status == BookingStatus.WAITLIST
    await db_session.rollback()
