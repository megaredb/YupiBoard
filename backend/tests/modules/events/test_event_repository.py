import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import EventFilterParams
from app.modules.users.models import User
from app.modules.users.repository import UserRepository


async def create_organizer(
    session: AsyncSession, rating: Decimal | None = None
) -> User:
    return await UserRepository(session).create(
        email=f"organizer_{uuid.uuid7().hex}@example.com",
        hashed_password="some_hashed_password",
        rating_as_organizer=rating,
    )


async def create_published_event(
    session: AsyncSession,
    organizer: User,
    title: str,
    max_players: int = 6,
    current_confirmed: int = 0,
) -> Event:
    return await EventRepository(session).create(
        organizer_id=organizer.id,
        title=title,
        description="A casual game night",
        game_title="Catan",
        address="Main street 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        max_players=max_players,
        current_confirmed=current_confirmed,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,
        is_verified=True,
    )


async def find_ids(
    session: AsyncSession, **filters: object
) -> tuple[set[uuid.UUID], int]:
    rows, total, _ = await EventRepository(session).find_catalog(
        EventFilterParams.model_validate(filters)
    )
    return {event.id for event, _ in rows}, total


@pytest.mark.asyncio
async def test_find_catalog_filters_by_available_seats_min(
    db_session: AsyncSession,
) -> None:
    token = uuid.uuid7().hex
    organizer = await create_organizer(db_session)
    full = await create_published_event(
        db_session, organizer, f"{token} full", max_players=4, current_confirmed=4
    )
    one_left = await create_published_event(
        db_session, organizer, f"{token} one", max_players=4, current_confirmed=3
    )
    five_left = await create_published_event(
        db_session, organizer, f"{token} five", max_players=6, current_confirmed=1
    )

    assert await find_ids(db_session, title=token) == (
        {full.id, one_left.id, five_left.id},
        3,
    )
    assert await find_ids(db_session, title=token, available_seats_min=1) == (
        {one_left.id, five_left.id},
        2,
    )
    assert await find_ids(db_session, title=token, available_seats_min=5) == (
        {five_left.id},
        1,
    )
    assert await find_ids(db_session, title=token, available_seats_min=6) == (set(), 0)


@pytest.mark.asyncio
async def test_find_catalog_filters_by_organizer_rating_min(
    db_session: AsyncSession,
) -> None:
    token = uuid.uuid7().hex
    top_rated = await create_published_event(
        db_session,
        await create_organizer(db_session, Decimal("4.50")),
        f"{token} top",
    )
    mid_rated = await create_published_event(
        db_session,
        await create_organizer(db_session, Decimal("3.00")),
        f"{token} mid",
    )
    unrated = await create_published_event(
        db_session,
        await create_organizer(db_session),
        f"{token} unrated",
    )

    assert await find_ids(db_session, title=token) == (
        {top_rated.id, mid_rated.id, unrated.id},
        3,
    )
    assert await find_ids(db_session, title=token, organizer_rating_min="3.0") == (
        {top_rated.id, mid_rated.id},
        2,
    )
    assert await find_ids(db_session, title=token, organizer_rating_min="4.5") == (
        {top_rated.id},
        1,
    )
