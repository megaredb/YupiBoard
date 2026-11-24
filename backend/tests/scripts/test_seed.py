from unittest.mock import patch

import pytest
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import Event
from app.modules.users.models import User
from app.scripts.seed import SEED_USER_EMAILS, seed_database


@pytest.mark.asyncio
async def test_seed_database_is_idempotent_and_blocked_in_production(
    db_session: AsyncSession,
) -> None:
    with (
        patch("app.scripts.seed.settings.ENVIRONMENT", "production"),
        pytest.raises(RuntimeError, match="production"),
    ):
        await seed_database(db_session)

    first = await seed_database(db_session, reset=True)
    assert first["created_users"] == len(SEED_USER_EMAILS)
    assert first["created_events"] >= 6

    second = await seed_database(db_session, reset=False)
    assert second["created_users"] == 0
    assert second["created_events"] == 0

    user_count = await db_session.scalar(
        select(func.count(User.id)).where(User.email.in_(SEED_USER_EMAILS))
    )
    assert user_count == len(SEED_USER_EMAILS)

    events_count = await db_session.scalar(
        select(func.count(Event.id)).where(Event.title.like("[Seed]%"))
    )
    assert events_count == first["created_events"]
