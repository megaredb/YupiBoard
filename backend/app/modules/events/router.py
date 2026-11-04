import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.storage import MediaService, get_media_service
from app.modules.auth.dependencies import get_current_verified_user
from app.modules.events.dependencies import get_event_service
from app.modules.events.schemas import (
    EventCreate,
    EventCreateResponse,
    EventFilterParams,
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
    summary="Search, filter and sort active published events",
)
async def list_events(
    filters: Annotated[EventFilterParams, Query()],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventPage:
    return await event_service.get_catalog(filters)


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
