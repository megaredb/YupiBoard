import uuid
from datetime import datetime

from app.core.exceptions import BadRequestException, NotFoundException
from app.modules.event_applications.repository import EventApplicationRepository
from app.modules.event_ratings.repository import EventRatingRepository
from app.modules.events.geo import make_point
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
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
        values["location"] = make_point(values.pop("lat"), values.pop("lon"))
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
        if "lat" in values or "lon" in values:
            if "lat" not in values or "lon" not in values:
                raise BadRequestException("lat and lon must be provided together")
            values["location"] = make_point(values.pop("lat"), values.pop("lon"))
        candidate = {**event.__dict__, **values}
        if candidate["min_players"] > candidate["max_players"]:
            raise BadRequestException("min_players cannot exceed max_players")
        if (
            candidate["end_datetime"]
            and candidate["end_datetime"] <= candidate["start_datetime"]
        ):
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
        application_counts = await self.application_repo.active_counts(
            [event.id for event in events]
        )
        rating_summaries = await self.rating_repo.summaries(
            list({event.organizer_id for event in events})
        )
        items = [
            self._to_read(
                event,
                active_applications=application_counts.get(event.id, 0),
                rating_summary=rating_summaries.get(event.organizer_id, (0, 0)),
            )
            for event in events
        ]
        return EventPage(items=items, total=total, page=page, page_size=page_size)

    def event_read(self, event: Event) -> EventRead:
        return self._to_read(event)

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

    def _to_read(
        self,
        event: Event,
        *,
        active_applications: int | None = None,
        rating_summary: tuple[float, int] | None = None,
    ) -> EventRead:
        if rating_summary is None:
            rating_summary = (0, 0)
        if active_applications is None:
            active_applications = 0
        rating_average, rating_count = rating_summary
        return EventRead.model_validate(
            {
                **{
                    column.name: getattr(event, column.name)
                    for column in event.__table__.columns
                    if column.name != "location"
                },
                "lat": event.lat,
                "lon": event.lon,
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
