import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from app.core.exceptions import (
    BadRequestException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.bookings.models import BookingStatus
from app.modules.bookings.repository import BookingRepository
from app.modules.events.models import NOT_HELD_EVENT_STATUSES, Event
from app.modules.events.repository import EventRepository
from app.modules.reviews.models import Review, ReviewTargetRole
from app.modules.reviews.repository import ReviewRepository
from app.modules.users.models import User
from app.modules.users.repository import UserRepository


def _ensure_window_open(event: Event, now: datetime) -> None:
    if event.status in NOT_HELD_EVENT_STATUSES:
        raise BadRequestException("This event did not take place")
    if now < event.end_datetime:
        raise BadRequestException("Reviews open after the event ends")
    if now > event.review_deadline:
        raise BadRequestException(
            "Review window is closed (48 hours after the event end)"
        )


class ReviewService:
    def __init__(
        self,
        review_repo: ReviewRepository,
        event_repo: EventRepository,
        booking_repo: BookingRepository,
        user_repo: UserRepository,
    ) -> None:
        self.review_repo = review_repo
        self.event_repo = event_repo
        self.booking_repo = booking_repo
        self.user_repo = user_repo

    async def rate_organizer(
        self, event_id: uuid.UUID, player: User, score: int
    ) -> Review:
        event = await self._get_event(event_id)
        if event.organizer_id == player.id:
            raise BadRequestException("Organizers cannot rate themselves")
        _ensure_window_open(event, datetime.now(UTC))
        if not await self._has_attended(event.id, player.id):
            raise ForbiddenException(
                "Only participants marked as attended can rate the organizer"
            )
        return await self._save(
            event, player.id, event.organizer_id, ReviewTargetRole.ORGANIZER, score
        )

    async def rate_player(
        self,
        event_id: uuid.UUID,
        organizer: User,
        player_id: uuid.UUID,
        score: int,
    ) -> Review:
        event = await self._get_event(event_id)
        if event.organizer_id != organizer.id:
            raise ForbiddenException("Only the event organizer can rate participants")
        if player_id == organizer.id:
            raise BadRequestException("Organizers cannot rate themselves")
        _ensure_window_open(event, datetime.now(UTC))
        if not await self._has_attended(event.id, player_id):
            raise BadRequestException(
                "Only participants marked as attended can be rated"
            )
        return await self._save(
            event, organizer.id, player_id, ReviewTargetRole.PLAYER, score
        )

    async def get_my_reviews(
        self, event_id: uuid.UUID, user: User
    ) -> tuple[datetime, bool, Sequence[Review]]:
        """Returns (review_deadline, can_review, reviews left by the user)."""
        event = await self._get_event(event_id)
        now = datetime.now(UTC)
        window_open = (
            event.status not in NOT_HELD_EVENT_STATUSES
            and event.end_datetime <= now <= event.review_deadline
        )
        is_organizer = event.organizer_id == user.id
        can_review = window_open and (
            is_organizer or await self._has_attended(event.id, user.id)
        )
        reviews = await self.review_repo.list_by_reviewer(event.id, user.id)
        return event.review_deadline, can_review, reviews

    async def _get_event(self, event_id: uuid.UUID) -> Event:
        event = await self.event_repo.get_by_id(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        return event

    async def _has_attended(self, event_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        booking = await self.booking_repo.get_latest_for_user(event_id, user_id)
        return booking is not None and booking.status == BookingStatus.ATTENDED

    async def _save(
        self,
        event: Event,
        reviewer_id: uuid.UUID,
        reviewee_id: uuid.UUID,
        target_role: ReviewTargetRole,
        score: int,
    ) -> Review:
        # Serializes concurrent reviews of one user, whose rating the Review model recomputes.
        reviewee = await self.user_repo.lock_by_id(reviewee_id)
        if reviewee is None:
            raise NotFoundException("User not found")

        review = await self.review_repo.get_for_pair(event.id, reviewer_id, reviewee_id)
        if review is None:
            review = await self.review_repo.create(
                event_id=event.id,
                reviewer_id=reviewer_id,
                reviewee_id=reviewee_id,
                target_role=target_role,
                score=score,
            )
        else:
            review = await self.review_repo.update(review, score=score)
        # The rating columns were updated in SQL; reload them for later reads in this session.
        await self.user_repo.session.refresh(reviewee)
        return review
