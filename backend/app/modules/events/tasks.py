import logging
import uuid
from datetime import UTC, datetime

from app.core.database import async_session_maker
from app.core.taskiq import broker
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService
from app.modules.locations.geocoding import GeocodingService
from app.modules.locations.repository import CityRepository
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


@broker.task
async def geocode_event_coordinates(event_id: str) -> bool:
    """Retry geocoding for an event saved at its city centre."""
    try:
        parsed_id = uuid.UUID(event_id)
    except ValueError:
        return False

    async with async_session_maker() as session, session.begin():
        repo = EventRepository(session)
        event = await repo.get_by_id(parsed_id)
        if event is None or event.is_deleted:
            return False

        center = await CityRepository(session).get_center(event.city)
        results = await GeocodingService().geocode(
            event.address, city=event.city, center=center, limit=1
        )
        if not results:
            return False

        await repo.update(event, lat=results[0].lat, lon=results[0].lon)
        logger.info(
            "Updated geocoded coordinates for event %s (%s, %s)",
            event.id,
            results[0].lat,
            results[0].lon,
        )
        return True
