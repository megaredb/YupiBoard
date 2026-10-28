from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
)
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.event_ratings.models import EventRating
from app.modules.event_ratings.repository import EventRatingRepository
from app.modules.events.models import Event, EventStatus
from app.modules.users.models import User


class EventRatingService:
    def __init__(
        self,
        rating_repo: EventRatingRepository,
        application_repo: EventApplicationRepository,
    ) -> None:
        self.rating_repo = rating_repo
        self.application_repo = application_repo

    async def create(
        self, event: Event, reviewer: User, score: int, comment: str | None
    ) -> EventRating:
        if event.status != EventStatus.COMPLETED:
            raise BadRequestException("Only completed events can be rated")
        if event.organizer_id == reviewer.id:
            raise BadRequestException("Organizers cannot rate their own event")
        if not await self.application_repo.has_accepted(event.id, reviewer.id):
            raise ForbiddenException("Only accepted participants can rate the host")
        if await self.rating_repo.exists(event.id, reviewer.id):
            raise ConflictException("You have already rated this event")
        return await self.rating_repo.create(event.id, reviewer.id, score, comment)
