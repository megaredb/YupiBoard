from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.event_applications.dependencies import (
    get_event_application_repository,
)
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.event_ratings.repository import EventRatingRepository
from app.modules.event_ratings.service import EventRatingService


def get_event_rating_repository(session: SessionDep) -> EventRatingRepository:
    return EventRatingRepository(session)


def get_event_rating_service(
    rating_repo: Annotated[EventRatingRepository, Depends(get_event_rating_repository)],
    application_repo: Annotated[
        EventApplicationRepository, Depends(get_event_application_repository)
    ],
) -> EventRatingService:
    return EventRatingService(rating_repo, application_repo)
