import uuid
from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.event_ratings.models import EventRating
from app.modules.events.models import Event


class EventRatingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        event_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        score: int,
        comment: str | None,
    ) -> EventRating:
        rating = EventRating(
            event_id=event_id,
            reviewer_id=reviewer_id,
            score=score,
            comment=comment,
        )
        self.session.add(rating)
        await self.session.flush()
        await self.session.refresh(rating)
        return rating

    async def exists(self, event_id: uuid.UUID, reviewer_id: uuid.UUID) -> bool:
        result = await self.session.execute(
            select(EventRating.id).where(
                EventRating.event_id == event_id,
                EventRating.reviewer_id == reviewer_id,
            )
        )
        return result.scalar_one_or_none() is not None

    async def summaries(
        self, organizer_ids: Sequence[uuid.UUID]
    ) -> dict[uuid.UUID, tuple[float, int]]:
        if not organizer_ids:
            return {}
        result = await self.session.execute(
            select(
                Event.organizer_id,
                func.avg(EventRating.score),
                func.count(EventRating.id),
            )
            .join(Event, Event.id == EventRating.event_id)
            .where(Event.organizer_id.in_(organizer_ids))
            .group_by(Event.organizer_id)
        )
        return {
            organizer_id: (float(average), count)
            for organizer_id, average, count in result.all()
        }

    async def summary(self, organizer_id: uuid.UUID) -> tuple[float, int]:
        return (await self.summaries([organizer_id])).get(organizer_id, (0, 0))
