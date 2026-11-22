import uuid
from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.auth.dependencies import get_current_user, get_current_verified_user
from app.modules.reviews.dependencies import get_review_service
from app.modules.reviews.schemas import (
    MyEventReviewsResponse,
    ReviewCreate,
    ReviewRead,
)
from app.modules.reviews.service import ReviewService
from app.modules.users.models import User

router = APIRouter(tags=["reviews"])


@router.get(
    "/events/{event_id}/reviews/me",
    response_model=MyEventReviewsResponse,
    summary="My reviews for the event, the review deadline and whether I can review",
)
async def get_my_event_reviews(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReviewService, Depends(get_review_service)],
) -> MyEventReviewsResponse:
    deadline, can_review, reviews = await service.get_my_reviews(event_id, current_user)
    return MyEventReviewsResponse(
        review_deadline=deadline,
        can_review=can_review,
        reviews=[ReviewRead.model_validate(review) for review in reviews],
    )


@router.put(
    "/events/{event_id}/reviews/organizer",
    response_model=ReviewRead,
    summary="Attended player rates the organizer (1-5); repeat call updates it",
)
async def rate_organizer(
    event_id: uuid.UUID,
    payload: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReviewService, Depends(get_review_service)],
) -> ReviewRead:
    review = await service.rate_organizer(event_id, current_user, payload.score)
    return ReviewRead.model_validate(review)


@router.put(
    "/events/{event_id}/reviews/players/{user_id}",
    response_model=ReviewRead,
    summary="Organizer rates an attended player (1-5); repeat call updates it",
)
async def rate_player(
    event_id: uuid.UUID,
    user_id: uuid.UUID,
    payload: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_verified_user)],
    service: Annotated[ReviewService, Depends(get_review_service)],
) -> ReviewRead:
    review = await service.rate_player(event_id, current_user, user_id, payload.score)
    return ReviewRead.model_validate(review)
