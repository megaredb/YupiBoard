import logging
from datetime import UTC, datetime

from app.core.database import async_session_maker
from app.core.taskiq import broker
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService

logger = logging.getLogger("yupiboard.events")


@broker.task(schedule=[{"cron": "* * * * *"}])
async def advance_event_statuses() -> tuple[int, int]:
    async with async_session_maker() as session, session.begin():
        service = EventService(
            EventRepository(session),
            notification_service=NotificationService(NotificationRepository(session)),
        )
        started, completed = await service.advance_statuses(datetime.now(UTC))
    if started or completed:
        logger.info("Events started: %d, completed: %d", started, completed)
    return started, completed
