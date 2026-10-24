import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.auth.dependencies import (
    get_current_superuser,
    get_current_user,
    get_current_verified_user,
)
from app.modules.events.dependencies import get_event_service
from app.modules.events.models import ApplicationStatus, EventStatus
from app.modules.events.schemas import (
    ApplicationStatusUpdate,
    EventApplicationRead,
    EventCreate,
    EventCreateResponse,
    EventModerationUpdate,
    EventPage,
    EventRatingCreate,
    EventRatingRead,
    EventRead,
    EventUpdate,
)
from app.modules.events.service import EventService
from app.modules.users.models import User

router = APIRouter(prefix="/events", tags=["events"])


@router.post(
    "",
    response_model=EventCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_event(
    data: EventCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventCreateResponse:
    event = await event_service.create(current_user, data)
    return EventCreateResponse(
        message="Event sent to moderation",
        event=await event_service.event_read(await event_service.get_event(event.id)),
    )


@router.get("", response_model=EventPage)
async def list_events(
    event_service: Annotated[EventService, Depends(get_event_service)],
    city: Annotated[str | None, Query(max_length=255)] = None,
    game_title: Annotated[str | None, Query(max_length=255)] = None,
    starts_after: datetime | None = None,
    starts_before: datetime | None = None,
    min_cost: Annotated[float | None, Query(ge=0)] = None,
    max_cost: Annotated[float | None, Query(ge=0)] = None,
    lat: Annotated[float | None, Query(ge=-90, le=90)] = None,
    lon: Annotated[float | None, Query(ge=-180, le=180)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> EventPage:
    if (lat is None) != (lon is None):
        raise BadRequestException("lat and lon must be provided together")
    if min_cost is not None and max_cost is not None and min_cost > max_cost:
        raise BadRequestException("min_cost cannot exceed max_cost")
    return await event_service.get_page(
        city=city,
        game_title=game_title,
        starts_after=starts_after,
        starts_before=starts_before,
        min_cost=min_cost,
        max_cost=max_cost,
        lat=lat,
        lon=lon,
        page=page,
        page_size=page_size,
    )


@router.get("/mine", response_model=EventPage)
async def list_my_events(
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
    status_filter: Annotated[EventStatus | None, Query(alias="status")] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> EventPage:
    return await event_service.get_page(
        organizer_id=current_user.id,
        status=status_filter,
        page=page,
        page_size=page_size,
        public_only=False,
    )


@router.get("/{event_id}", response_model=EventRead)
async def get_event(
    event_id: uuid.UUID,
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    event = await event_service.get_public_event(event_id)
    return await event_service.event_read(event)


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: uuid.UUID,
    data: EventUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    event = await event_service.get_event(event_id)
    if event.organizer_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException("Only the organizer can update this event")
    updated = await event_service.update(event, data)
    return await event_service.event_read(await event_service.get_event(updated.id))


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> None:
    event = await event_service.get_event(event_id)
    if event.organizer_id != current_user.id and not current_user.is_superuser:
        raise ForbiddenException("Only the organizer can delete this event")
    await event_service.event_repo.update(event, is_deleted=True)


@router.patch("/{event_id}/moderation", response_model=EventRead)
async def moderate_event(
    event_id: uuid.UUID,
    data: EventModerationUpdate,
    _admin: Annotated[User, Depends(get_current_superuser)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRead:
    event = await event_service.get_event(event_id)
    updated = await event_service.moderate(
        event,
        data.status,
        data.rejection_reason,
        data.promoted_to_datetime,
        "promoted_to_datetime" in data.model_fields_set,
    )
    return await event_service.event_read(await event_service.get_event(updated.id))


@router.post(
    "/{event_id}/applications",
    response_model=EventApplicationRead,
    status_code=status.HTTP_201_CREATED,
)
async def apply_to_event(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventApplicationRead:
    event = await event_service.get_public_event(event_id)
    application = await event_service.apply(event, current_user)
    return EventApplicationRead.model_validate(application)


@router.patch(
    "/{event_id}/applications/{application_id}",
    response_model=EventApplicationRead,
)
async def update_application(
    event_id: uuid.UUID,
    application_id: uuid.UUID,
    data: ApplicationStatusUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventApplicationRead:
    application = await event_service.event_repo.get_application(application_id)
    if application is None or application.event_id != event_id:
        raise NotFoundException("Application not found")
    event = await event_service.get_event(event_id)
    if current_user.id != event.organizer_id and current_user.id != application.user_id:
        raise ForbiddenException("You cannot update this application")
    if (
        current_user.id == application.user_id
        and data.status != ApplicationStatus.CANCELLED
    ):
        raise ForbiddenException("Participants can only cancel their own application")
    if (
        current_user.id == event.organizer_id
        and data.status == ApplicationStatus.CANCELLED
    ):
        raise ForbiddenException("Organizers cannot cancel applications")
    updated = await event_service.update_application(application, data.status)
    return EventApplicationRead.model_validate(updated)


@router.get(
    "/{event_id}/applications",
    response_model=list[EventApplicationRead],
)
async def list_event_applications(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> list[EventApplicationRead]:
    event = await event_service.get_event(event_id)
    if current_user.id != event.organizer_id and not current_user.is_superuser:
        raise ForbiddenException("Only the organizer can view applications")
    applications = await event_service.event_repo.get_event_applications(event.id)
    return [EventApplicationRead.model_validate(item) for item in applications]


@router.post(
    "/{event_id}/ratings",
    response_model=EventRatingRead,
    status_code=status.HTTP_201_CREATED,
)
async def rate_event_host(
    event_id: uuid.UUID,
    data: EventRatingCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    event_service: Annotated[EventService, Depends(get_event_service)],
) -> EventRatingRead:
    event = await event_service.get_event(event_id)
    rating = await event_service.rate(event, current_user, data.score, data.comment)
    return EventRatingRead.model_validate(rating)
