import uuid
from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.reviews.models import Review


class ReviewRepository(BaseRepository[Review]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Review, session)

    async def get_for_pair(
        self, event_id: uuid.UUID, reviewer_id: uuid.UUID, reviewee_id: uuid.UUID
    ) -> Review | None:
        result = await self.session.execute(
            select(Review).where(
                Review.event_id == event_id,
                Review.reviewer_id == reviewer_id,
                Review.reviewee_id == reviewee_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_reviewer(
        self, event_id: uuid.UUID, reviewer_id: uuid.UUID
    ) -> Sequence[Review]:
        result = await self.session.execute(
            select(Review)
            .where(Review.event_id == event_id, Review.reviewer_id == reviewer_id)
            .order_by(Review.created_at, Review.id)
        )
        return result.scalars().all()
