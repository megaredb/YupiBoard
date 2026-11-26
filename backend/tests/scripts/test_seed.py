from unittest.mock import patch

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import Event
from app.modules.users.models import User
from app.scripts.seed import (
    SEED_USER_EMAILS,
    SEED_USERS,
    remove_seed_data,
    seed_database,
)


async def _count_seed_users(session: AsyncSession) -> int:
    return (
        await session.scalar(
            select(func.count(User.id)).where(User.email.in_(SEED_USER_EMAILS))
        )
        or 0
    )


async def _count_seed_events(session: AsyncSession) -> int:
    return (
        await session.scalar(
            select(func.count(Event.id))
            .join(User, Event.organizer_id == User.id)
            .where(User.email.in_(SEED_USER_EMAILS))
        )
        or 0
    )


@pytest.mark.asyncio
async def test_seed_is_blocked_in_production(db_session: AsyncSession) -> None:
    with patch("app.scripts.seed.settings.ENVIRONMENT", "production"):
        with pytest.raises(RuntimeError, match="production"):
            await seed_database(db_session)
        with pytest.raises(RuntimeError, match="production"):
            await remove_seed_data(db_session)


@pytest.mark.asyncio
async def test_seed_adds_data_and_remove_deletes_it(db_session: AsyncSession) -> None:
    # The tests share the development database: everything here is rolled back so an
    # existing seed survives the test run.
    await remove_seed_data(db_session)

    created = await seed_database(db_session)
    assert created["created_users"] == len(SEED_USER_EMAILS)
    assert created["created_events"] >= 10
    assert await _count_seed_users(db_session) == len(SEED_USER_EMAILS)
    assert await _count_seed_events(db_session) == created["created_events"]
    completed = {
        user.email: user.profile_completed_at is not None
        for user in await db_session.scalars(
            select(User).where(User.email.in_(SEED_USER_EMAILS))
        )
    }
    assert completed == {spec.email: spec.is_profile_complete for spec in SEED_USERS}

    removed = await remove_seed_data(db_session)
    assert removed == len(SEED_USER_EMAILS)
    assert await _count_seed_users(db_session) == 0
    assert await _count_seed_events(db_session) == 0
    await db_session.rollback()
