import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.modules.auth.dependencies import get_current_user
from app.modules.bookings.dependencies import get_booking_service
from app.modules.bookings.schemas import BookingCreateResponse
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
