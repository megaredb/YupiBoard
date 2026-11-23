import uuid
from collections.abc import Sequence
from datetime import datetime
from math import ceil
from typing import Literal

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.bookings.models import (
    ACTIVE_BOOKING_STATUSES,
    BLOCKED_BOOKING_STATUSES,
    SEATED_BOOKING_STATUSES,
    Booking,
    BookingStatus,
)
from app.modules.events.models import Event, EventStatus
from app.modules.users.models import User


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Booking, session)

    async def get_active_booking(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Booking | None:
        result = await self.session.execute(
            select(Booking)
            .options(joinedload(Booking.user), joinedload(Booking.event))
            .where(
                Booking.event_id == event_id,
                Booking.user_id == user_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES | BLOCKED_BOOKING_STATUSES),
            )
            .order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_first_waitlisted(self, event_id: uuid.UUID) -> Booking | None:
        result = await self.session.execute(
            select(Booking)
            .options(joinedload(Booking.user), joinedload(Booking.event))
            .where(
                Booking.event_id == event_id,
                Booking.status == BookingStatus.WAITLIST,
            )
            .order_by(Booking.created_at, Booking.id)
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_booking(
        self,
        event_id: uuid.UUID,
        user_id: uuid.UUID,
        status: BookingStatus = BookingStatus.PENDING,
    ) -> Booking:
        return await self.create(
            event_id=event_id,
            user_id=user_id,
            status=status,
        )

    async def get_by_id_for_event(
        self, booking_id: uuid.UUID, event_id: uuid.UUID
    ) -> Booking | None:
        result = await self.session.execute(
            select(Booking)
            .options(joinedload(Booking.user), joinedload(Booking.event))
            .where(Booking.id == booking_id, Booking.event_id == event_id)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        page: int,
        limit: int,
        status: BookingStatus | None = None,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[list[Booking], int, int]:
        latest_per_event = (
            select(Booking.id)
            .distinct(Booking.event_id)
            .where(Booking.user_id == user_id)
            .order_by(Booking.event_id, Booking.created_at.desc(), Booking.id.desc())
            .subquery()
        )
        filters = [
            Booking.user_id == user_id,
            Booking.id.in_(select(latest_per_event.c.id)),
        ]
        if status is not None:
            filters.append(Booking.status == status)
        else:
            filters.append(Booking.status != BookingStatus.CANCELLED_BY_PLAYER)
        total = int(
            await self.session.scalar(
                select(func.count()).select_from(Booking).where(*filters)
            )
            or 0
        )
        sort_column = Booking.created_at if sort_by == "date" else Event.title
        ordering = (
            sort_column.asc() if sort_order == "asc" else sort_column.desc(),
            Booking.id,
        )
        result = await self.session.execute(
            select(Booking)
            .join(Event, Event.id == Booking.event_id)
            .options(joinedload(Booking.event), joinedload(Booking.user))
            .where(*filters)
            .order_by(*ordering)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return list(result.scalars().all()), total, ceil(total / limit) if total else 1

    async def list_for_event(
        self,
        event_id: uuid.UUID,
        page: int,
        limit: int,
        status: BookingStatus | None = None,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[list[Booking], int, int]:
        filters = [Booking.event_id == event_id]
        if status is not None:
            filters.append(Booking.status == status)
        total = int(
            await self.session.scalar(
                select(func.count()).select_from(Booking).where(*filters)
            )
            or 0
        )
        sort_column = (
            Booking.created_at
            if sort_by == "date"
            else func.lower(func.coalesce(User.first_name, User.email))
        )
        ordering = (
            sort_column.asc() if sort_order == "asc" else sort_column.desc(),
            Booking.id,
        )
        result = await self.session.execute(
            select(Booking)
            .join(User, User.id == Booking.user_id)
            .options(joinedload(Booking.user), joinedload(Booking.event))
            .where(*filters)
            .order_by(*ordering)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return list(result.scalars().all()), total, ceil(total / limit) if total else 1

    async def get_latest_for_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Booking | None:
        result = await self.session.execute(
            select(Booking)
            .where(Booking.event_id == event_id, Booking.user_id == user_id)
            .order_by(Booking.created_at.desc(), Booking.id.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def list_active_upcoming_for_user(
        self, user_id: uuid.UUID
    ) -> Sequence[Booking]:
        result = await self.session.execute(
            select(Booking)
            .join(Event, Event.id == Booking.event_id)
            .where(
                Booking.user_id == user_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
                Event.is_deleted.is_(False),
                Event.status.in_((EventStatus.PUBLISHED, EventStatus.ON_MODERATION)),
                Event.start_datetime > func.now(),
            )
            .order_by(Booking.created_at.asc())
        )
        return result.scalars().all()

    async def mark_unmarked_as_no_show(self, ended_before: datetime) -> int:
        """CONFIRMED -> NO_SHOW for completed events that ended before the cutoff."""
        closed_events = select(Event.id).where(
            Event.status == EventStatus.COMPLETED,
            Event.end_datetime <= ended_before,
        )
        result = await self.session.execute(
            update(Booking)
            .where(
                Booking.status == BookingStatus.CONFIRMED,
                Booking.event_id.in_(closed_events),
            )
            .values(status=BookingStatus.NO_SHOW)
            .execution_options(synchronize_session=False)
        )
        return int(getattr(result, "rowcount", 0) or 0)

    async def get_confirmed_participants(self, event_id: uuid.UUID) -> Sequence[User]:
        result = await self.session.execute(
            select(User)
            .join(Booking, Booking.user_id == User.id)
            .where(
                Booking.event_id == event_id,
                Booking.status.in_(SEATED_BOOKING_STATUSES),
            )
            .order_by(Booking.created_at.asc())
        )
        return result.scalars().all()

    async def is_confirmed_participant(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        count = await self.session.scalar(
            select(func.count())
            .select_from(Booking)
            .where(
                Booking.event_id == event_id,
                Booking.user_id == user_id,
                Booking.status.in_(SEATED_BOOKING_STATUSES),
            )
        )
        return bool(count and count > 0)
