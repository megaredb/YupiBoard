from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService
from app.modules.notifications.dependencies import get_notification_service
from app.modules.notifications.service import NotificationService


def get_event_repository(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_service(
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> EventService:
    return EventService(event_repo, notification_service=notification_service)
