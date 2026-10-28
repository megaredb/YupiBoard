from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService


def get_event_repository(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_service(
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
) -> EventService:
    return EventService(event_repo)
