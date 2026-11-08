import uuid
from collections.abc import Sequence
from math import ceil
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.repositories import BaseRepository
from app.modules.bookings.models import ACTIVE_BOOKING_STATUSES, Booking, BookingStatus
from app.modules.events.models import Event
from app.modules.users.models import User


class BookingRepository(BaseRepository[Booking]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Booking, session)

    async def get_active_booking(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> Booking | None:
        result = await self.session.execute(
            select(Booking).where(
                Booking.event_id == event_id,
                Booking.user_id == user_id,
                Booking.status.in_(ACTIVE_BOOKING_STATUSES),
            )
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
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[list[Booking], int, int]:
        filters = [Booking.user_id == user_id]
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
            .options(joinedload(Booking.event))
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
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[list[Booking], int, int]:
        filters = [Booking.event_id == event_id]
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
            .options(joinedload(Booking.user))
            .where(*filters)
            .order_by(*ordering)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return list(result.scalars().all()), total, ceil(total / limit) if total else 1

    async def get_confirmed_participants(self, event_id: uuid.UUID) -> Sequence[User]:
        result = await self.session.execute(
            select(User)
            .join(Booking, Booking.user_id == User.id)
            .where(
                Booking.event_id == event_id,
                Booking.status == BookingStatus.CONFIRMED,
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
                Booking.status == BookingStatus.CONFIRMED,
            )
        )
        return bool(count and count > 0)
