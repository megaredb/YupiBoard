import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.event_applications.models import ApplicationStatus, EventApplication


class EventApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, event_id: uuid.UUID, user_id: uuid.UUID) -> EventApplication:
        application = EventApplication(event_id=event_id, user_id=user_id)
        self.session.add(application)
        await self.session.flush()
        await self.session.refresh(application)
        return application

    async def get(self, application_id: uuid.UUID) -> EventApplication | None:
        return await self.session.get(EventApplication, application_id)

    async def for_event(self, event_id: uuid.UUID) -> list[EventApplication]:
        result = await self.session.execute(
            select(EventApplication)
            .where(EventApplication.event_id == event_id)
            .order_by(EventApplication.created_at)
        )
        return list(result.scalars().all())

    async def active_count(self, event_id: uuid.UUID) -> int:
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

    async def active_counts(
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

    async def for_user(
        self, event_id: uuid.UUID, user_id: uuid.UUID
    ) -> EventApplication | None:
        result = await self.session.execute(
            select(EventApplication).where(
                EventApplication.event_id == event_id,
                EventApplication.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def has_accepted(self, event_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            select(EventApplication.id).where(
                EventApplication.event_id == event_id,
                EventApplication.user_id == user_id,
                EventApplication.status == ApplicationStatus.ACCEPTED,
            )
        )
        return result.scalar_one_or_none() is not None
