import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.exceptions import BadRequestException
from app.core.storage import MediaService, get_media_service
from app.modules.auth.dependencies import get_current_user, get_current_verified_user
from app.modules.events.dependencies import get_event_service
from app.modules.events.models import EventStatus
from app.modules.events.schemas import (
    EventCreate,
    EventCreateResponse,
    EventImageUploadResponse,
    EventPage,
    EventRead,
)
from app.modules.events.service import EventService
from app.modules.users.models import User

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "/upload-image",
    response_model=EventImageUploadResponse,
    summary="Upload event cover image (max 5 MB, JPEG/PNG/WebP, converted to WebP)",
)
async def upload_event_image(
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_verified_user)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
) -> EventImageUploadResponse:
    image_url = await media_service.upload_event_image(file, current_user.id)
    return EventImageUploadResponse(image_url=image_url)


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
    radius_km: Annotated[
        float | None,
        Query(ge=0, description="Filter events within radius in kilometers"),
    ] = None,
    city: Annotated[str | None, Query(max_length=100)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> EventPage:
    if (lat is None) != (lon is None):
        raise BadRequestException("lat and lon must be provided together")
    if radius_km is not None and (lat is None or lon is None):
        raise BadRequestException(
            "lat and lon must be provided when radius_km is specified"
        )
    return await event_service.get_catalog(
        city=city,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        page=page,
        limit=limit,
    )


@router.get("/my/created", response_model=EventPage, summary="List events created by me")
async def list_my_created_events(
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
    event_status: Annotated[EventStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[Literal["date", "name"], Query()] = "date",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> EventPage:
    return await event_service.get_organizer_events(
        current_user.id,
        status=event_status,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/my/participating", response_model=EventPage, summary="List events where I participate")
async def list_my_participating_events(
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
    event_status: Annotated[EventStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[Literal["date", "name"], Query()] = "date",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> EventPage:
    return await event_service.get_participant_events(
        current_user.id,
        status=event_status,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
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


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> None:
    await event_service.cancel(event_id, current_user.id)
