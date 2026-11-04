import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status

from app.modules.auth.dependencies import get_current_user, get_current_verified_user
from app.modules.bookings.dependencies import get_booking_service
from app.modules.bookings.schemas import BookingCreateResponse, BookingPage, BookingRead
from app.modules.bookings.service import BookingService
from app.modules.users.models import User

router = APIRouter(tags=["bookings"])


@router.post(
    "/events/{id}/bookings",
    response_model=BookingCreateResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Player submits seat booking request",
)
async def create_booking_request(
    id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    booking_service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingCreateResponse:
    booking = await booking_service.apply_for_seat(id, current_user)
    return BookingCreateResponse(
        booking_id=booking.id,
        event_id=booking.event_id,
        status=booking.status,
        message="Application submitted for organizer review.",
    )


@router.get("/bookings/me", response_model=BookingPage)
async def list_my_bookings(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[BookingService, Depends(get_booking_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[Literal["date", "name"], Query()] = "date",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> BookingPage:
    items, total, total_pages = await service.list_for_user(
        current_user.id, page, limit, sort_by, sort_order
    )
    return BookingPage(items=items, total=total, page=page, total_pages=total_pages)


@router.get("/events/{event_id}/bookings", response_model=BookingPage)
async def list_event_bookings(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    service: Annotated[BookingService, Depends(get_booking_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[Literal["date", "name"], Query()] = "date",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> BookingPage:
    items, total, total_pages = await service.list_for_event(
        event_id, current_user.id, page, limit, sort_by, sort_order
    )
    return BookingPage(items=items, total=total, page=page, total_pages=total_pages)


@router.post(
    "/events/{event_id}/bookings/{booking_id}/approve",
    response_model=BookingRead,
)
async def approve_booking(
    event_id: uuid.UUID,
    booking_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingRead:
    booking = await service.decide(
        event_id, booking_id, current_user, approve=True
    )
    return BookingRead.model_validate(booking)


@router.post(
    "/events/{event_id}/bookings/{booking_id}/reject",
    response_model=BookingRead,
)
async def reject_booking(
    event_id: uuid.UUID,
    booking_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingRead:
    booking = await service.decide(
        event_id, booking_id, current_user, approve=False
    )
    return BookingRead.model_validate(booking)


@router.delete("/events/{event_id}/bookings/me", response_model=BookingRead)
async def cancel_my_booking(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[BookingService, Depends(get_booking_service)],
) -> BookingRead:
    booking = await service.cancel_for_player(event_id, current_user.id)
    return BookingRead.model_validate(booking)
