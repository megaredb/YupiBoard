import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.modules.reviews.models import ReviewTargetRole


class ReviewCreate(BaseModel):
    score: int = Field(ge=1, le=5, description="Star rating from 1 to 5")


class ReviewRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewee_id: uuid.UUID
    target_role: ReviewTargetRole
    score: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MyEventReviewsResponse(BaseModel):
    review_deadline: datetime
    can_review: bool
    reviews: list[ReviewRead]
