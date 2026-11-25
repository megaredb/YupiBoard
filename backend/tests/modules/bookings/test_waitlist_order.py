import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.bookings.models import Booking, BookingStatus
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.service import BookingService
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.users.models import User


async def _full_event_with_waitlist(
    session: AsyncSession,
) -> tuple[User, Event, Booking, dict[str, Booking]]:
    """A full 1-seat event, one seated player and four waitlisted ones.

    Join order: early, middle, late, unaccepted. Accept order: late, early, middle.
    """
    users = {
        key: User(
            email=f"queue_{key}_{uuid.uuid7().hex}@example.com", hashed_password="x"
        )
        for key in ("organizer", "seated", "early", "middle", "late", "unaccepted")
    }
    session.add_all(users.values())
    await session.flush()
    start = datetime.now(UTC) + timedelta(days=1)
    event = Event(
        organizer_id=users["organizer"].id,
        title="Waitlist queue",
        description="Test event",
        game_title="Catan",
        address="Main street 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=start,
        end_datetime=start + timedelta(hours=4),
        max_players=1,
        current_confirmed=1,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,
        is_verified=True,
    )
    session.add(event)
    await session.flush()

    joined = datetime.now(UTC) - timedelta(hours=5)
    accepted = {
        "late": joined + timedelta(hours=2),
        "early": joined + timedelta(hours=3),
        "middle": joined + timedelta(hours=4),
    }
    seat = Booking(
        event_id=event.id, user_id=users["seated"].id, status=BookingStatus.CONFIRMED
    )
    waiting: dict[str, Booking] = {}
    for offset, key in enumerate(("early", "middle", "late", "unaccepted")):
        waiting[key] = Booking(
            event_id=event.id,
            user_id=users[key].id,
            status=BookingStatus.WAITLIST,
            is_preapproved=key in accepted,
            preapproved_at=accepted.get(key),
            created_at=joined + timedelta(minutes=offset),
        )
    session.add_all([seat, *waiting.values()])
    await session.flush()
    return users["organizer"], event, seat, waiting


@pytest.mark.asyncio
async def test_waitlist_is_listed_in_accept_order(db_session: AsyncSession) -> None:
    # Shares the development database: everything here is rolled back at the end.
    _, event, _, waiting = await _full_event_with_waitlist(db_session)

    items, total, _ = await BookingRepository(db_session).list_for_event(
        event.id, page=1, limit=10, status=BookingStatus.WAITLIST, sort_order="desc"
    )

    assert total == 4
    assert [booking.id for booking in items] == [
        waiting[key].id for key in ("late", "early", "middle", "unaccepted")
    ]
    await db_session.rollback()


@pytest.mark.asyncio
async def test_freed_seats_go_to_accepted_players_in_accept_order(
    db_session: AsyncSession,
) -> None:
    # Shares the development database: everything here is rolled back at the end.
    organizer, event, seat, waiting = await _full_event_with_waitlist(db_session)
    service = BookingService(BookingRepository(db_session), EventRepository(db_session))

    await service.decide(event.id, seat.id, organizer, approve=False)
    await db_session.refresh(waiting["late"])
    assert waiting["late"].status == BookingStatus.CONFIRMED
    assert waiting["late"].preapproved_at is None

    await service.decide(event.id, waiting["late"].id, organizer, approve=False)
    for key in ("early", "middle"):
        await db_session.refresh(waiting[key])
    assert waiting["early"].status == BookingStatus.CONFIRMED
    assert waiting["middle"].status == BookingStatus.WAITLIST
    await db_session.rollback()
