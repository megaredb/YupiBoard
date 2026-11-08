import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.storage import MediaService, get_media_service
from app.modules.auth.dependencies import (
    get_current_user,
    get_current_verified_user,
    get_optional_current_user,
)
from app.modules.events.dependencies import get_event_service
from app.modules.events.models import EventStatus
from app.modules.events.schemas import (
    EventCreate,
    EventCreateResponse,
    EventFilterParams,
    EventImageUploadResponse,
    EventPage,
    EventRead,
    EventUpdate,
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
    current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
) -> EventPage:
    current_user_id = current_user.id if current_user else None
    return await event_service.get_catalog(filters, current_user_id=current_user_id)


@router.get(
    "/my/created",
    response_model=EventPage,
    summary="List events created by me",
)
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
        current_user_id=current_user.id,
        status=event_status,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/my/participating",
    response_model=EventPage,
    summary="List events where I participate",
)
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
        current_user_id=current_user.id,
        status=event_status,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get(
    "/{event_id}",
    response_model=EventRead,
    summary="Retrieve public details of an event",
)
async def get_event(
    event_id: uuid.UUID,
    event_service: Annotated[EventService, Depends(get_event_service)],
    current_user: Annotated[User | None, Depends(get_optional_current_user)] = None,
) -> EventRead:
    return await event_service.get_public_event(event_id, current_user=current_user)


@router.patch(
    "/{event_id}",
    response_model=EventRead,
    summary="Organizer updates event details before start time",
)
async def update_event(
    event_id: uuid.UUID,
    data: EventUpdate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    return await event_service.update_event(event_id, current_user, data)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> None:
    await event_service.cancel(event_id, current_user)
