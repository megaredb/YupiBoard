import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository
from app.modules.bookings.models import Booking, BookingStatus
from app.modules.events.models import EventStatus
from app.modules.events.repository import EventRepository
from app.modules.favorites.models import Favorite
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.models import Notification


@pytest.mark.asyncio
async def test_delete_profile_blocked_with_active_events_and_cleans_up_after_cancel(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    organizer, org_token = await create_mock_user(
        first_name="Host", last_name="Person", is_verified=True
    )
    player, player_token = await create_mock_user(
        first_name="Player", last_name="One", is_verified=True
    )
    waitlisted, _ = await create_mock_user(
        first_name="Waiting", last_name="Two", is_verified=True
    )

    org_headers = {"Authorization": f"Bearer {org_token}"}
    player_headers = {"Authorization": f"Bearer {player_token}"}

    # Organizer has an active Published event
    event = await EventRepository(db_session).create(
        organizer_id=organizer.id,
        title="Active Session",
        description="Desc",
        game_title="Catan",
        address="Main St 1",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=datetime.now(UTC) + timedelta(days=2),
        end_datetime=datetime.now(UTC) + timedelta(days=2, hours=4),
        min_players=2,
        max_players=2,
        current_confirmed=1,
        entry_cost=Decimal("0.00"),
        status=EventStatus.PUBLISHED,
        is_verified=True,
    )
    confirmed_booking = Booking(
        event_id=event.id, user_id=player.id, status=BookingStatus.CONFIRMED
    )
    waitlist_booking = Booking(
        event_id=event.id, user_id=waitlisted.id, status=BookingStatus.WAITLIST
    )
    db_session.add_all([confirmed_booking, waitlist_booking])
    db_session.add(Favorite(user_id=player.id, event_id=event.id))
    db_session.add(
        Notification(
            user_id=player.id,
            notification_type=NotificationType.BOOKING_APPROVED,
            title="Approved",
            message="Seat confirmed",
        )
    )
    refresh_row = await RefreshTokenRepository(db_session).create(
        token_hash=f"delhash_{uuid.uuid4().hex}",
        user_id=player.id,
        expires_at=datetime.now(UTC) + timedelta(days=7),
    )
    action_row = await ActionTokenRepository(db_session).create(
        jti=uuid.uuid4().hex,
        user_id=player.id,
        token_type="reset_password",
        is_used=False,
        expires_at=datetime.now(UTC) + timedelta(hours=24),
    )
    await db_session.commit()

    # 1. Organizer with active event is blocked (409 Conflict) per SRS 3.8.2.2
    blocked_res = await async_client.delete("/api/v1/users/me", headers=org_headers)
    assert blocked_res.status_code == 409

    # 2. Player deletes their profile -> cancels booking, promotes waitlist, revokes tokens, clears PII
    p_del = await async_client.delete("/api/v1/users/me", headers=player_headers)
    assert p_del.status_code == 204

    await db_session.refresh(confirmed_booking)
    await db_session.refresh(waitlist_booking)
    await db_session.refresh(event)
    await db_session.refresh(refresh_row)
    await db_session.refresh(action_row)
    assert confirmed_booking.status == BookingStatus.CANCELLED_BY_PLAYER
    assert waitlist_booking.status == BookingStatus.PENDING
    assert event.current_confirmed == 0
    assert refresh_row.revoked is True
    assert action_row.is_used is True

    await db_session.refresh(player)
    assert player.is_deleted is True
    assert player.bio is None
    assert player.banner_url is None

    # 3. Organizer cancels event -> now can delete profile
    cancel_res = await async_client.delete(
        f"/api/v1/events/{event.id}", headers=org_headers
    )
    assert cancel_res.status_code == 204

    org_del = await async_client.delete("/api/v1/users/me", headers=org_headers)
    assert org_del.status_code == 204

    # Historical event shows "Deleted User" for organizer name
    ev_after = await async_client.get(f"/api/v1/events/{event.id}")
    assert ev_after.status_code == 200
    assert ev_after.json()["organizer"]["name"] == "Deleted User"
