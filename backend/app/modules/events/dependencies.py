from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.event_applications.dependencies import (
    get_event_application_repository,
)
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.event_ratings.dependencies import get_event_rating_repository
from app.modules.event_ratings.repository import EventRatingRepository
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService


def get_event_repository(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_service(
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    application_repo: Annotated[
        EventApplicationRepository, Depends(get_event_application_repository)
    ],
    rating_repo: Annotated[EventRatingRepository, Depends(get_event_rating_repository)],
) -> EventService:
    return EventService(event_repo, application_repo, rating_repo)
