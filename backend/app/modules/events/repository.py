import uuid
from collections.abc import Sequence
from datetime import datetime

from geoalchemy2 import Geography
from sqlalchemy import case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.events.models import Event, EventStatus


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
            requested_location = cast(
                func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326),
                Geography(geometry_type="POINT", srid=4326),
            )
            distance = func.ST_Distance(Event.location, requested_location)
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
