import logging
from datetime import UTC, datetime

from app.core.database import async_session_maker
from app.core.taskiq import broker
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.service import BookingService
from app.modules.events.repository import EventRepository

logger = logging.getLogger("yupiboard.bookings")


@broker.task(schedule=[{"cron": "* * * * *"}])
async def close_open_requests() -> int:
    async with async_session_maker() as session, session.begin():
        service = BookingService(BookingRepository(session), EventRepository(session))
        closed = await service.close_open_requests(datetime.now(UTC))
    if closed:
        logger.info(
            "Closed %d pending or waitlisted bookings of started events", closed
        )
    return closed


@broker.task(schedule=[{"cron": "*/10 * * * *"}])
async def expire_unmarked_attendance() -> int:
    async with async_session_maker() as session, session.begin():
        service = BookingService(BookingRepository(session), EventRepository(session))
        expired = await service.expire_unmarked_attendance(datetime.now(UTC))
    if expired:
        logger.info("Marked %d unmarked bookings as no-show", expired)
    return expired
