from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.repository import (
    EventApplicationRepository,
    EventRatingRepository,
    EventRepository,
)
from app.modules.events.service import EventService


def get_event_repository(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_application_repository(
    session: SessionDep,
) -> EventApplicationRepository:
    return EventApplicationRepository(session)


def get_event_rating_repository(session: SessionDep) -> EventRatingRepository:
    return EventRatingRepository(session)


def get_event_service(
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    application_repo: Annotated[
        EventApplicationRepository, Depends(get_event_application_repository)
    ],
    rating_repo: Annotated[EventRatingRepository, Depends(get_event_rating_repository)],
) -> EventService:
    return EventService(event_repo, application_repo, rating_repo)
