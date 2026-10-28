import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.bookings.models import ACTIVE_BOOKING_STATUSES, Booking, BookingStatus


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
