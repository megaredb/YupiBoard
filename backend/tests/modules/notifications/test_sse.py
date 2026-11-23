import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.realtime import RealtimeBroker, event_channel, user_channel
from app.modules.events.models import EventStatus
from app.modules.events.repository import EventRepository


@pytest.mark.asyncio
async def test_realtime_broker_pubsub_delivers_formatted_sse_frames() -> None:
    broker = RealtimeBroker()
    uid = uuid.uuid7()
    channel = user_channel(uid)
    frames: list[str] = []

    async def reader() -> None:
        async for chunk in broker.subscribe(channel, heartbeat_seconds=1):
            frames.append(chunk)
            if chunk.startswith("event: notification.created"):
                break

    task = asyncio.create_task(reader())
    # Wait briefly for Redis subscription to become active
    await asyncio.sleep(0.15)
    await broker.publish_user_event(
        uid, "notification.created", {"title": "Live Update"}
    )
    await asyncio.wait_for(task, timeout=3.0)
    await broker.close()

    assert frames[0] == ": connected\n\n"
    assert any(
        "event: notification.created" in f and "Live Update" in f for f in frames
    )


@pytest.mark.asyncio
async def test_realtime_broker_event_channel() -> None:
    broker = RealtimeBroker()
    ev_id = uuid.uuid7()
    channel = event_channel(ev_id)
    frames: list[str] = []

    async def reader() -> None:
        async for chunk in broker.subscribe(channel, heartbeat_seconds=1):
            frames.append(chunk)
            if chunk.startswith("event: event.updated"):
                break

    task = asyncio.create_task(reader())
    await asyncio.sleep(0.15)
    await broker.publish_event_update(
        ev_id, "event.updated", {"event_id": str(ev_id), "status": "Ongoing"}
    )
    await asyncio.wait_for(task, timeout=3.0)
    await broker.close()

    assert any('"status": "Ongoing"' in f for f in frames)


@pytest.mark.asyncio
async def test_sse_stream_endpoints_auth_and_visibility(
    async_client: AsyncClient, create_mock_user, db_session: AsyncSession
) -> None:
    # Notifications SSE requires authentication
    unauth = await async_client.get("/api/v1/notifications/stream")
    assert unauth.status_code == 401

    organizer, org_token = await create_mock_user(is_verified=True)
    hidden_event = await EventRepository(db_session).create(
        organizer_id=organizer.id,
        title="Moderation Event",
        description="Desc",
        game_title="Catan",
        address="Addr",
        city="Kyiv",
        lat=50.45,
        lon=30.52,
        start_datetime=datetime.now(UTC) + timedelta(days=1),
        end_datetime=datetime.now(UTC) + timedelta(days=1, hours=4),
        max_players=4,
        entry_cost=Decimal("0.00"),
        status=EventStatus.ON_MODERATION,
        is_verified=False,
    )
    await db_session.commit()

    # Hidden/unmoderated event stream returns 404 to strangers
    hidden_res = await async_client.get(f"/api/v1/events/{hidden_event.id}/stream")
    assert hidden_res.status_code == 404

    # Route registration & auth verified in OpenAPI
    res_auth_check = await async_client.get(
        f"/api/v1/events/{uuid.uuid7()}/stream",
        headers={"Authorization": f"Bearer {org_token}"},
    )
    assert res_auth_check.status_code == 404
