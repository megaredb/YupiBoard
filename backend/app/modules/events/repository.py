import uuid
from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.events.models import (
    ApplicationStatus,
    Event,
    EventApplication,
    EventRating,
    EventStatus,
)


class EventRepository(BaseRepository[Event]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Event, session)

    async def find(
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
    ) -> tuple[Sequence[Event], int]:
        filters = [Event.is_deleted.is_(False)]
        if public_only:
            filters.append(Event.status == EventStatus.PUBLISHED)
        if organizer_id is not None:
            filters.append(Event.organizer_id == organizer_id)
        if status is not None:
            filters.append(Event.status == status)
        if city:
            filters.append(func.lower(Event.city) == city.strip().lower())
        if game_title:
            filters.append(Event.game_title.ilike(f"%{game_title.strip()}%"))
        if starts_after is not None:
            filters.append(Event.start_datetime >= starts_after)
        if starts_before is not None:
            filters.append(Event.start_datetime <= starts_before)
        if min_cost is not None:
            filters.append(Event.entry_cost >= min_cost)
        if max_cost is not None:
            filters.append(Event.entry_cost <= max_cost)

        promoted_first = case(
            (Event.promoted_to_datetime > func.now(), 0),
            else_=1,
        )
        ordering = [promoted_first]
        # TODO: maybe find a lib for working with lat and lon
        if lat is not None and lon is not None:
            distance = (
                6371
                * 2
                * func.asin(
                    func.sqrt(
                        func.pow(func.sin(func.radians(Event.lat - lat) / 2), 2)
                        + func.cos(func.radians(lat))
                        * func.cos(func.radians(Event.lat))
                        * func.pow(func.sin(func.radians(Event.lon - lon) / 2), 2)
                    )
                )
            )
            ordering.append(distance)
        else:
            ordering.append(Event.start_datetime)

        count_result = await self.session.execute(
            select(func.count()).select_from(Event).where(*filters)
        )
        result = await self.session.execute(
            select(Event)
            .options(joinedload(Event.organizer))
            .where(*filters)
            .order_by(*ordering, Event.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return result.scalars().all(), count_result.scalar_one()

    async def get_by_id_with_organizer(self, event_id: uuid.UUID) -> Event | None:
        result = await self.session.execute(
            select(Event)
            .options(joinedload(Event.organizer))
            .where(Event.id == event_id, Event.is_deleted.is_(False))
        )
        return result.scalar_one_or_none()

    async def lock_event(self, event_id: uuid.UUID) -> Event | None:
        result = await self.session.execute(
            select(Event)
            .where(Event.id == event_id, Event.is_deleted.is_(False))
            .with_for_update()
        )
        return result.scalar_one_or_none()

    async def active_application_count(self, event_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(EventApplication)
            .where(
                EventApplication.event_id == event_id,
                EventApplication.status.in_(
                    [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED]
                ),
            )
        )
        return result.scalar_one()

    async def active_application_counts(
        self, event_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, int]:
        if not event_ids:
            return {}
        result = await self.session.execute(
            select(EventApplication.event_id, func.count())
            .where(
                EventApplication.event_id.in_(event_ids),
                EventApplication.status.in_(
                    [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED]
                ),
            )
            .group_by(EventApplication.event_id)
        )
        return dict(result.all())

    async def application_for_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> EventApplication | None:
        result = await self.session.execute(
            select(EventApplication).where(
                EventApplication.event_id == event_id,
                EventApplication.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_application(
        self, application_id: uuid.UUID
    ) -> EventApplication | None:
        return await self.session.get(EventApplication, application_id)

    async def get_event_applications(
        self, event_id: uuid.UUID
    ) -> Sequence[EventApplication]:
        result = await self.session.execute(
            select(EventApplication)
            .where(EventApplication.event_id == event_id)
            .order_by(EventApplication.created_at)
        )
        return result.scalars().all()

    async def update_application_status(
        self, application: EventApplication, status: ApplicationStatus
    ) -> EventApplication:
        application.status = status
        await self.session.flush()
        await self.session.refresh(application)
        return application

    async def host_rating_summary(self, organizer_id: uuid.UUID) -> tuple[float, int]:
        result = await self.session.execute(
            select(func.avg(EventRating.score), func.count(EventRating.id)).where(
                EventRating.organizer_id == organizer_id
            )
        )
        average, count = result.one()
        return float(average or 0), count

    async def host_rating_summaries(
        self, organizer_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, tuple[float, int]]:
        if not organizer_ids:
            return {}
        result = await self.session.execute(
            select(
                EventRating.organizer_id,
                func.avg(EventRating.score),
                func.count(EventRating.id),
            )
            .where(EventRating.organizer_id.in_(organizer_ids))
            .group_by(EventRating.organizer_id)
        )
        return {
            organizer_id: (float(average), count)
            for organizer_id, average, count in result.all()
        }

    async def has_accepted_application(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        result = await self.session.execute(
            select(EventApplication.id).where(
                EventApplication.event_id == event_id,
                EventApplication.user_id == user_id,
                EventApplication.status == ApplicationStatus.ACCEPTED,
            )
        )
        return result.scalar_one_or_none() is not None

    async def rating_exists(self, event_id: uuid.UUID, reviewer_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            select(EventRating.id).where(
                EventRating.event_id == event_id,
                EventRating.reviewer_id == reviewer_id,
            )
        )
        return result.scalar_one_or_none() is not None


class EventApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, event_id: uuid.UUID, user_id: uuid.UUID) -> EventApplication:
        application = EventApplication(event_id=event_id, user_id=user_id)
        self.session.add(application)
        await self.session.flush()
        await self.session.refresh(application)
        return application


# TODO: extract rating it its own module
class EventRatingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        event_id: uuid.UUID,
        organizer_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        score: int,
        comment: str | None,
    ) -> EventRating:
        rating = EventRating(
            event_id=event_id,
            organizer_id=organizer_id,
            reviewer_id=reviewer_id,
            score=score,
            comment=comment,
        )
        self.session.add(rating)
        await self.session.flush()
        await self.session.refresh(rating)
        return rating
