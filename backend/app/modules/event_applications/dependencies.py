from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.event_applications.service import EventApplicationService
from app.modules.events.repository import EventRepository


def get_event_application_repository(
    session: SessionDep,
) -> EventApplicationRepository:
    return EventApplicationRepository(session)


def get_event_repository_for_application(session: SessionDep) -> EventRepository:
    return EventRepository(session)


def get_event_application_service(
    application_repo: Annotated[
        EventApplicationRepository, Depends(get_event_application_repository)
    ],
    event_repo: Annotated[
        EventRepository, Depends(get_event_repository_for_application)
    ],
) -> EventApplicationService:
    return EventApplicationService(application_repo, event_repo)
