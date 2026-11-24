import asyncio
import json
import logging
import time
import uuid
from collections.abc import AsyncGenerator
from typing import Any

import redis.asyncio as aioredis

from app.core.config import settings

logger = logging.getLogger("yupiboard.realtime")


def user_channel(user_id: uuid.UUID | str) -> str:
    return f"sse:user:{user_id}"


def event_channel(event_id: uuid.UUID | str) -> str:
    return f"sse:event:{event_id}"


def format_sse_frame(event_type: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, default=str)
    return f"event: {event_type}\ndata: {payload}\n\n"


class RealtimeBroker:
    """Redis Pub/Sub broker backing Server-Sent Events across API and worker processes."""

    def __init__(self, redis_url: str | None = None) -> None:
        self._redis_url = redis_url or settings.REDIS_URL
        self._pub_client: aioredis.Redis | None = None
        self._pub_loop: asyncio.AbstractEventLoop | None = None

    def _get_pub_client(self) -> aioredis.Redis:
        loop = asyncio.get_running_loop()
        if (
            self._pub_client is None
            or self._pub_loop is not loop
            or self._pub_loop.is_closed()
        ):
            self._pub_client = aioredis.from_url(self._redis_url, decode_responses=True)
            self._pub_loop = loop
        return self._pub_client

    async def publish(
        self, channel: str, event_type: str, data: dict[str, Any]
    ) -> None:
        envelope = json.dumps({"event": event_type, "data": data}, default=str)
        try:
            client = self._get_pub_client()
            await client.publish(channel, envelope)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Failed to publish SSE event to %s: %s", channel, exc)

    async def publish_user_event(
        self, user_id: uuid.UUID | str, event_type: str, data: dict[str, Any]
    ) -> None:
        await self.publish(user_channel(user_id), event_type, data)

    async def publish_event_update(
        self, event_id: uuid.UUID | str, event_type: str, data: dict[str, Any]
    ) -> None:
        await self.publish(event_channel(event_id), event_type, data)

    async def subscribe(
        self, channel: str, *, heartbeat_seconds: int | None = None
    ) -> AsyncGenerator[str]:
        interval = (
            heartbeat_seconds
            if heartbeat_seconds is not None
            else settings.SSE_HEARTBEAT_SECONDS
        )
        client = aioredis.from_url(self._redis_url, decode_responses=True)
        pubsub = client.pubsub()
        try:
            await pubsub.subscribe(channel)
            yield ": connected\n\n"
            last_sent = time.monotonic()
            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True, timeout=1.0
                )
                if message is not None and message.get("type") == "message":
                    raw = message.get("data")
                    if isinstance(raw, str):
                        try:
                            parsed = json.loads(raw)
                            ev = str(parsed.get("event", "message"))
                            data = parsed.get("data", {})
                            yield format_sse_frame(
                                ev, data if isinstance(data, dict) else {"value": data}
                            )
                        except json.JSONDecodeError:
                            yield format_sse_frame("message", {"raw": raw})
                        last_sent = time.monotonic()
                elif time.monotonic() - last_sent >= interval:
                    yield ": ping\n\n"
                    last_sent = time.monotonic()
                await asyncio.sleep(0)
        finally:
            try:
                await pubsub.unsubscribe(channel)
            except Exception as exc:  # noqa: BLE001
                logger.debug("Ignoring SSE unsubscribe cleanup error: %s", exc)
            await pubsub.aclose()
            await client.aclose()

    async def close(self) -> None:
        if self._pub_client is not None:
            try:
                await self._pub_client.aclose()
            except Exception as exc:  # noqa: BLE001
                logger.debug("Ignoring SSE client close error: %s", exc)
            self._pub_client = None
            self._pub_loop = None


realtime_broker = RealtimeBroker()
