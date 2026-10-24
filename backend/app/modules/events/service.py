import uuid
from datetime import datetime

from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
)
from app.modules.events.models import (
    ApplicationStatus,
    Event,
    EventApplication,
    EventRating,
    EventStatus,
)
from app.modules.events.repository import (
    EventApplicationRepository,
    EventRatingRepository,
    EventRepository,
)
from app.modules.events.schemas import (
    EventCreate,
    EventHostRead,
    EventPage,
    EventRead,
    EventUpdate,
)
from app.modules.users.models import User


class EventService:
    def __init__(
        self,
        event_repo: EventRepository,
        application_repo: EventApplicationRepository,
        rating_repo: EventRatingRepository,
    ) -> None:
        self.event_repo = event_repo
        self.application_repo = application_repo
        self.rating_repo = rating_repo

    async def create(self, organizer: User, data: EventCreate) -> Event:
        values = data.model_dump()
        if values["photo_url"] is not None:
            values["photo_url"] = str(values["photo_url"])
        return await self.event_repo.create(
            **values,
            organizer_id=organizer.id,
            status=EventStatus.ON_MODERATION,
            rejection_reason=None,
            is_verified=False,
            is_deleted=False,
        )

    async def update(self, event: Event, data: EventUpdate) -> Event:
        values = data.model_dump(exclude_unset=True)
        if values.get("photo_url") is not None:
            values["photo_url"] = str(values["photo_url"])
        candidate = {**event.__dict__, **values}
        min_players = candidate["min_players"]
        max_players = candidate["max_players"]
        if min_players > max_players:
            raise BadRequestException("min_players cannot exceed max_players")
        start_datetime = candidate["start_datetime"]
        end_datetime = candidate["end_datetime"]
        if end_datetime and end_datetime <= start_datetime:
            raise BadRequestException("end_datetime must be later than start_datetime")
        for name, value in values.items():
            setattr(event, name, value)
        event.status = EventStatus.ON_MODERATION
        event.rejection_reason = None
        event.is_verified = False
        await self.event_repo.session.flush()
        await self.event_repo.session.refresh(event)
        return event

    async def get_event(self, event_id: uuid.UUID) -> Event:
        event = await self.event_repo.get_by_id_with_organizer(event_id)
        if event is None:
            raise NotFoundException("Event not found")
        return event

    async def get_public_event(self, event_id: uuid.UUID) -> Event:
        event = await self.get_event(event_id)
        if event.status != EventStatus.PUBLISHED:
            raise NotFoundException("Event not found")
        return event

    async def get_page(
        self,
        *,
        organizer_id: uuid.UUID | None = None,
        status: EventStatus | None = None,
        city: str | None = None,
        game_title: str | None = None,
        starts_after: datetime | None = None,
        starts_before: datetime | None = None,
        lat: float | None = None,
        lon: float | None = None,
        min_cost: float | None = None,
        max_cost: float | None = None,
        page: int = 1,
        page_size: int = 20,
        public_only: bool = True,
    ) -> EventPage:
        events, total = await self.event_repo.find(
            organizer_id=organizer_id,
            status=status,
            city=city,
            game_title=game_title,
            starts_after=starts_after,
            starts_before=starts_before,
            lat=lat,
            lon=lon,
            min_cost=min_cost,
            max_cost=max_cost,
            page=page,
            page_size=page_size,
            public_only=public_only,
        )
        application_counts = await self.event_repo.active_application_counts(
            [event.id for event in events]
        )
        rating_summaries = await self.event_repo.host_rating_summaries(
            list({event.organizer_id for event in events})
        )
        items = [
            await self._to_read(
                event,
                active_applications=application_counts.get(event.id, 0),
                rating_summary=rating_summaries.get(event.organizer_id, (0, 0)),
            )
            for event in events
        ]
        return EventPage(items=items, total=total, page=page, page_size=page_size)

    async def event_read(self, event: Event) -> EventRead:
        return await self._to_read(event)

    async def apply(self, event: Event, user: User) -> EventApplication:
        locked_event = await self.event_repo.lock_event(event.id)
        if locked_event is None or locked_event.status != EventStatus.PUBLISHED:
            raise NotFoundException("Event not found")
        event = locked_event
        if event.organizer_id == user.id:
            raise BadRequestException("Organizers cannot apply to their own event")
        previous = await self.event_repo.application_for_user(event.id, user.id)
        if previous is not None:
            raise ConflictException("You have already applied to this event")
        if (
            await self.event_repo.active_application_count(event.id)
            >= event.max_players
        ):
            raise ConflictException("Event has no available seats")
        application = await self.application_repo.create(event.id, user.id)
        # TODO: Notify the organizer when the notification module is available.
        return application

    async def update_application(
        self, application: EventApplication, status: ApplicationStatus
    ) -> EventApplication:
        if status == ApplicationStatus.PENDING:
            raise BadRequestException("Application status cannot be reset to pending")
        if (
            application.status != ApplicationStatus.PENDING
            and status != ApplicationStatus.CANCELLED
        ):
            raise ConflictException("Only pending applications can be updated")
        if status == ApplicationStatus.CANCELLED and application.status not in (
            ApplicationStatus.PENDING,
            ApplicationStatus.ACCEPTED,
        ):
            raise ConflictException("Only active applications can be cancelled")
        return await self.event_repo.update_application_status(application, status)

    async def moderate(
        self,
        event: Event,
        status: EventStatus,
        rejection_reason: str | None,
        promoted_to_datetime: datetime | None,
        update_promotion: bool,
    ) -> Event:
        event.status = status
        event.rejection_reason = rejection_reason
        event.is_verified = status == EventStatus.PUBLISHED
        if update_promotion:
            event.promoted_to_datetime = promoted_to_datetime
        await self.event_repo.session.flush()
        await self.event_repo.session.refresh(event)
        return event

    async def rate(
        self, event: Event, reviewer: User, score: int, comment: str | None
    ) -> EventRating:
        if event.status != EventStatus.COMPLETED:
            raise BadRequestException("Only completed events can be rated")
        if event.organizer_id == reviewer.id:
            raise BadRequestException("Organizers cannot rate their own event")
        if not await self.event_repo.has_accepted_application(event.id, reviewer.id):
            raise ForbiddenException("Only accepted participants can rate the host")
        if await self.event_repo.rating_exists(event.id, reviewer.id):
            raise ConflictException("You have already rated this event")
        return await self.rating_repo.create(
            event.id, event.organizer_id, reviewer.id, score, comment
        )

    async def _to_read(
        self,
        event: Event,
        *,
        active_applications: int | None = None,
        rating_summary: tuple[float, int] | None = None,
    ) -> EventRead:
        if rating_summary is None:
            rating_summary = await self.event_repo.host_rating_summary(
                event.organizer_id
            )
        if active_applications is None:
            active_applications = await self.event_repo.active_application_count(
                event.id
            )
        rating_average, rating_count = rating_summary
        return EventRead.model_validate(
            {
                **{
                    column.name: getattr(event, column.name)
                    for column in event.__table__.columns
                },
                "host": EventHostRead(
                    id=event.organizer.id,
                    full_name=event.organizer.full_name,
                    avatar_url=event.organizer.avatar_url,
                    rating_average=rating_average,
                    rating_count=rating_count,
                ),
                "free_seats": max(0, event.max_players - active_applications),
            }
        )
