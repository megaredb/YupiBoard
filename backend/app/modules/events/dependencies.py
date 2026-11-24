from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService
from app.modules.locations.dependencies import (
    get_city_repository,
    get_geocoding_service,
)
from app.modules.locations.geocoding import GeocodingService
from app.modules.locations.repository import CityRepository
from app.modules.moderation.repository import AuditLogRepository
from app.modules.notifications.dependencies import get_notification_service
from app.modules.notifications.service import NotificationService


def get_event_repository(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_service(
    session: SessionDep,
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
    geocoding_service: Annotated[GeocodingService, Depends(get_geocoding_service)],
    city_repo: Annotated[CityRepository, Depends(get_city_repository)],
) -> EventService:
    return EventService(
        event_repo,
        notification_service=notification_service,
        geocoding_service=geocoding_service,
        city_repo=city_repo,
        audit_repo=AuditLogRepository(session),
    )
