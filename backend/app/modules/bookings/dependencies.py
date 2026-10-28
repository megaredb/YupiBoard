from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.service import BookingService
from app.modules.events.dependencies import get_event_repository
from app.modules.events.repository import EventRepository


def get_booking_repository(session: SessionDep) -> BookingRepository:
    return BookingRepository(session)


def get_booking_service(
    booking_repo: Annotated[BookingRepository, Depends(get_booking_repository)],
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
) -> BookingService:
    return BookingService(booking_repo, event_repo)
