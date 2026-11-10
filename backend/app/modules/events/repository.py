import uuid
from collections.abc import Sequence
from math import ceil
from typing import Any, Literal

from sqlalchemy import (
    Boolean,
    ColumnElement,
    Numeric,
    String,
    case,
    cast,
    func,
    null,
    select,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import contains_eager, joinedload

from app.core.repositories import BaseRepository
from app.modules.events.models import Event, EventStatus
from app.modules.events.schemas import EventFilterParams, EventSortBy, SortOrder
from app.modules.users.models import User

LIKE_ESCAPE = "\\"


def _contains_pattern(value: str) -> str:
    escaped = (
        value.replace(LIKE_ESCAPE, LIKE_ESCAPE * 2)
        .replace("%", f"{LIKE_ESCAPE}%")
        .replace("_", f"{LIKE_ESCAPE}_")
    )
    return f"%{escaped}%"


class EventRepository(BaseRepository[Event]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Event, session)

    async def find_catalog(
        self,
        filters: EventFilterParams,
        current_user_id: uuid.UUID | None = None,
    ) -> tuple[Sequence[tuple[Event, float | None, bool, Any]], int, int]:
        from app.modules.bookings.models import Booking
        from app.modules.favorites.models import Favorite

        distance_meters: ColumnElement[Any] | None = None
        distance_km: ColumnElement[Any] | None = None
        if filters.lat is not None and filters.lon is not None:
            distance_meters = func.earth_distance(
                func.ll_to_earth(Event.lat, Event.lon),
                func.ll_to_earth(filters.lat, filters.lon),
            )
            distance_km = cast(distance_meters / 1000.0, Numeric(10, 1))

        conditions = self._build_conditions(filters, distance_meters)
        ordering = self._build_ordering(filters, distance_km)

        count_result = await self.session.execute(
            select(func.count(Event.id))
            .select_from(Event)
            .join(Event.organizer)
            .where(*conditions)
        )
        total = count_result.scalar_one()
        total_pages = ceil(total / filters.limit) if total > 0 else 1

        distance_column = (
            distance_km if distance_km is not None else cast(null(), Numeric(10, 1))
        )
        is_favorite_col = (
            case((Favorite.user_id.is_not(None), True), else_=False)
            if current_user_id is not None
            else cast(False, Boolean)
        )
        user_booking_col = (
            select(Booking.status)
            .where(
                Booking.event_id == Event.id,
                Booking.user_id == current_user_id,
            )
            .order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(1)
            .correlate(Event)
            .scalar_subquery()
            if current_user_id is not None
            else cast(null(), String)
        )

        query = (
            select(
                Event,
                distance_column.label("distance_km"),
                is_favorite_col.label("is_favorite"),
                user_booking_col.label("user_booking_status"),
            )
            .join(Event.organizer)
            .options(contains_eager(Event.organizer))
        )
        if current_user_id is not None:
            query = query.outerjoin(
                Favorite,
                (Favorite.event_id == Event.id) & (Favorite.user_id == current_user_id),
            )

        query = (
            query.where(*conditions)
            .order_by(*ordering)
            .offset((filters.page - 1) * filters.limit)
            .limit(filters.limit)
        )
        result = await self.session.execute(query)
        rows = [
            (
                row[0],
                float(row[1]) if row[1] is not None else None,
                bool(row[2]),
                row[3] if row[3] is not None else None,
            )
            for row in result.all()
        ]
        return rows, total, total_pages

    def _build_conditions(
        self,
        filters: EventFilterParams,
        distance_meters: ColumnElement[Any] | None,
    ) -> list[ColumnElement[bool]]:
        conditions: list[ColumnElement[bool]] = [
            Event.is_deleted.is_(False),
            Event.status == EventStatus.PUBLISHED,
            Event.is_verified.is_(True),
            Event.start_datetime > func.now(),
        ]

        if filters.title:
            conditions.append(
                Event.title.ilike(_contains_pattern(filters.title), escape=LIKE_ESCAPE)
            )

        if filters.organizer_id is not None:
            conditions.append(Event.organizer_id == filters.organizer_id)
        if filters.organizer_name:
            full_name = func.concat_ws(" ", User.first_name, User.last_name)
            conditions.append(
                full_name.ilike(
                    _contains_pattern(filters.organizer_name), escape=LIKE_ESCAPE
                )
            )
        if filters.organizer_rating_min is not None:
            conditions.append(User.rating_as_organizer >= filters.organizer_rating_min)
        if filters.organizer_rating_max is not None:
            conditions.append(User.rating_as_organizer <= filters.organizer_rating_max)

        if filters.city:
            conditions.append(func.lower(Event.city) == filters.city.lower())
        if distance_meters is not None and filters.radius_km is not None:
            conditions.append(distance_meters <= filters.radius_km * 1000.0)

        if filters.date_from is not None:
            conditions.append(Event.start_datetime >= filters.date_from)
        if filters.date_to is not None:
            conditions.append(Event.start_datetime <= filters.date_to)

        if filters.cost_min is not None:
            conditions.append(Event.entry_cost >= filters.cost_min)
        if filters.cost_max is not None:
            conditions.append(Event.entry_cost <= filters.cost_max)

        if filters.available_seats_min is not None:
            conditions.append(
                Event.max_players - Event.current_confirmed
                >= filters.available_seats_min
            )

        return conditions

    def _build_ordering(
        self,
        filters: EventFilterParams,
        distance_km: ColumnElement[Any] | None,
    ) -> list[Any]:
        if filters.sort_by is None:
            is_promoted_order = case(
                (Event.promoted_to_datetime > func.now(), 0),
                else_=1,
            )
            ordering: list[Any] = [
                is_promoted_order,
                Event.promoted_to_datetime.desc().nullslast(),
                distance_km if distance_km is not None else Event.start_datetime.asc(),
            ]
        else:
            sort_columns: dict[EventSortBy, Any] = {
                EventSortBy.TITLE: func.lower(Event.title),
                EventSortBy.DATE: Event.start_datetime,
                EventSortBy.DISTANCE: distance_km,
                EventSortBy.COST: Event.entry_cost,
            }
            column = sort_columns[filters.sort_by]
            if column is None:
                raise ValueError("lat and lon are required to sort by distance")
            ordering = [
                column.desc() if filters.sort_order == SortOrder.DESC else column.asc()
            ]

        ordering.append(Event.id)
        return ordering

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

    async def is_event_favorite(self, event_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        from app.modules.favorites.models import Favorite

        result = await self.session.scalar(
            select(func.count(Favorite.user_id)).where(
                Favorite.event_id == event_id, Favorite.user_id == user_id
            )
        )
        return bool(result and result > 0)

    async def get_user_booking_status(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Any | None:
        from app.modules.bookings.models import Booking

        result = await self.session.scalar(
            select(Booking.status)
            .where(
                Booking.event_id == event_id,
                Booking.user_id == user_id,
            )
            .order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(1)
        )
        return result

    async def find_by_organizer(
        self,
        organizer_id: uuid.UUID,
        *,
        current_user_id: uuid.UUID | None = None,
        status: EventStatus | None = None,
        page: int = 1,
        limit: int = 20,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[Sequence[tuple[Event, bool]], int, int]:
        from app.modules.favorites.models import Favorite

        filters = [Event.organizer_id == organizer_id, Event.is_deleted.is_(False)]
        if status is not None:
            filters.append(Event.status == status)
        count = await self.session.scalar(
            select(func.count()).select_from(Event).where(*filters)
        )
        total = int(count or 0)
        sort_column = Event.start_datetime if sort_by == "date" else Event.title
        ordering = (
            sort_column.asc() if sort_order == "asc" else sort_column.desc(),
            Event.id,
        )
        is_favorite_col = (
            case((Favorite.user_id.is_not(None), True), else_=False)
            if current_user_id is not None
            else cast(False, Boolean)
        )
        query = (
            select(Event, is_favorite_col.label("is_favorite"))
            .options(joinedload(Event.organizer))
            .where(*filters)
        )
        if current_user_id is not None:
            query = query.outerjoin(
                Favorite,
                (Favorite.event_id == Event.id) & (Favorite.user_id == current_user_id),
            )
        query = query.order_by(*ordering).offset((page - 1) * limit).limit(limit)
        result = await self.session.execute(query)
        rows = [(row[0], bool(row[1])) for row in result.all()]
        return rows, total, ceil(total / limit) if total else 1

    async def find_by_participant(
        self,
        user_id: uuid.UUID,
        *,
        current_user_id: uuid.UUID | None = None,
        status: EventStatus | None = None,
        page: int = 1,
        limit: int = 20,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[Sequence[tuple[Event, bool, Any]], int, int]:
        from app.modules.bookings.models import Booking
        from app.modules.favorites.models import Favorite

        filters = [Booking.user_id == user_id, Event.is_deleted.is_(False)]
        if status is not None:
            filters.append(Event.status == status)
        sort_column = Event.start_datetime if sort_by == "date" else Event.title
        ordering = (
            sort_column.asc() if sort_order == "asc" else sort_column.desc(),
            Event.id,
        )
        count = await self.session.scalar(
            select(func.count(func.distinct(Event.id)))
            .select_from(Event)
            .join(Booking, Booking.event_id == Event.id)
            .where(*filters)
        )
        total = int(count or 0)
        is_favorite_col = (
            case((Favorite.user_id.is_not(None), True), else_=False)
            if current_user_id is not None
            else cast(False, Boolean)
        )
        query = (
            select(
                Event,
                is_favorite_col.label("is_favorite"),
                Booking.status.label("user_booking_status"),
            )
            .join(Booking, Booking.event_id == Event.id)
            .options(joinedload(Event.organizer))
            .where(*filters)
        )
        if current_user_id is not None:
            query = query.outerjoin(
                Favorite,
                (Favorite.event_id == Event.id) & (Favorite.user_id == current_user_id),
            )
        query = (
            query.distinct().order_by(*ordering).offset((page - 1) * limit).limit(limit)
        )
        result = await self.session.execute(query)
        rows = [(row[0], bool(row[1]), row[2]) for row in result.all()]
        return rows, total, ceil(total / limit) if total else 1

    async def get_owned_event(
        self, event_id: uuid.UUID, organizer_id: uuid.UUID
    ) -> Event | None:
        result = await self.session.execute(
            select(Event).where(
                Event.id == event_id,
                Event.organizer_id == organizer_id,
                Event.is_deleted.is_(False),
            )
        )
        return result.scalar_one_or_none()

    async def get_active_booking_user_ids(self, event_id: uuid.UUID) -> list[uuid.UUID]:
        from app.modules.bookings.models import ACTIVE_BOOKING_STATUSES, Booking

        result = await self.session.scalars(
            select(func.distinct(Booking.user_id)).where(
                Booking.event_id == event_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            )
        )
        return list(result.all())

    async def cancel_event(self, event: Event) -> Event:
        from sqlalchemy import update

        from app.modules.bookings.models import (
            ACTIVE_BOOKING_STATUSES,
            Booking,
            BookingStatus,
        )

        event.status = EventStatus.CANCELLED
        event.current_confirmed = 0
        self.session.add(event)
        await self.session.execute(
            update(Booking)
            .where(
                Booking.event_id == event.id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            )
            .values(status=BookingStatus.CANCELLED_BY_SYSTEM)
        )
        await self.session.flush()
        return event
