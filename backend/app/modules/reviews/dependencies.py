from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.bookings.dependencies import get_booking_repository
from app.modules.bookings.repository import BookingRepository
from app.modules.events.dependencies import get_event_repository
from app.modules.events.repository import EventRepository
from app.modules.reviews.repository import ReviewRepository
from app.modules.reviews.service import ReviewService
from app.modules.users.dependencies import get_user_repository
from app.modules.users.repository import UserRepository


def get_review_repository(session: SessionDep) -> ReviewRepository:
    return ReviewRepository(session)


def get_review_service(
    review_repo: Annotated[ReviewRepository, Depends(get_review_repository)],
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    booking_repo: Annotated[BookingRepository, Depends(get_booking_repository)],
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
) -> ReviewService:
    return ReviewService(review_repo, event_repo, booking_repo, user_repo)
