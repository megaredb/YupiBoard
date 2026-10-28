import uuid
from collections.abc import Sequence
from math import ceil

from sqlalchemy import Numeric, case, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.events.models import Event, EventStatus


class EventRepository(BaseRepository[Event]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Event, session)

    async def find_catalog(
        self,
        *,
        city: str | None = None,
        lat: float | None = None,
        lon: float | None = None,
        radius_km: float | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> tuple[Sequence[tuple[Event, float | None]], int, int]:
        filters = [
            Event.is_deleted.is_(False),
            Event.status == EventStatus.PUBLISHED,
            Event.is_verified.is_(True),
            Event.start_datetime > func.now(),
        ]
        if city:
            filters.append(func.lower(Event.city) == city.strip().lower())

        is_promoted_order = case(
            (Event.promoted_to_datetime > func.now(), 0),
            else_=1,
        )
        ordering = [is_promoted_order, Event.promoted_to_datetime.desc().nullslast()]

        if lat is not None and lon is not None:
            distance_meters = func.earth_distance(
                func.ll_to_earth(Event.lat, Event.lon),
                func.ll_to_earth(lat, lon),
            )
            if radius_km is not None:
                filters.append(distance_meters <= radius_km * 1000.0)

            distance_km_expr = cast(
                distance_meters / 1000.0,
                Numeric(10, 1),
            )
            ordering.append(distance_km_expr)
            query = select(Event, distance_km_expr.label("distance_km"))
        else:
            ordering.append(Event.start_datetime.asc())
            query = select(Event, cast(None, Numeric(10, 1)).label("distance_km"))

        ordering.append(Event.id)

        count_result = await self.session.execute(
            select(func.count()).select_from(Event).where(*filters)
        )
        total = count_result.scalar_one()
        total_pages = ceil(total / limit) if total > 0 else 1

        result = await self.session.execute(
            query.options(joinedload(Event.organizer))
            .where(*filters)
            .order_by(*ordering)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        rows = [
            (row[0], float(row[1]) if row[1] is not None else None)
            for row in result.all()
        ]
        return rows, total, total_pages

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
