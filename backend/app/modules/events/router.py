import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.exceptions import BadRequestException
from app.modules.auth.dependencies import get_current_verified_user
from app.modules.events.dependencies import get_event_service
from app.modules.events.schemas import (
    EventCreate,
    EventCreateResponse,
    EventPage,
    EventRead,
)
from app.modules.events.service import EventService
from app.modules.users.models import User

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "",
    response_model=EventCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Organizer creates a new event session",
)
async def create_event(
    data: EventCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventCreateResponse:
    event = await event_service.create(current_user, data)
    return EventCreateResponse(
        event_id=event.id,
        status=event.status,
        is_verified=event.is_verified,
        message="Event submitted for administrative review.",
    )


@router.get(
    "",
    response_model=EventPage,
    summary="Browse nearby published events",
)
async def list_events(
    event_service: Annotated[EventService, Depends(get_event_service)],
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    city: Annotated[str | None, Query(max_length=100)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> EventPage:
    if (lat is None) != (lon is None):
        raise BadRequestException("lat and lon must be provided together")
    return await event_service.get_catalog(
        city=city,
        lat=lat,
        lon=lon,
        page=page,
        limit=limit,
    )


@router.get(
    "/{event_id}",
    response_model=EventRead,
    summary="Retrieve public details of a published event",
)
async def get_event(
    event_id: uuid.UUID,
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    return await event_service.get_public_event(event_id)
