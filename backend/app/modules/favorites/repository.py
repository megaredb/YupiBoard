import uuid
from collections.abc import Sequence
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.modules.events.models import Event
from app.modules.favorites.models import Favorite


class FavoriteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, user_id: uuid.UUID, event_id: uuid.UUID) -> Favorite | None:
        return await self.session.get(Favorite, (user_id, event_id))

    async def add(self, user_id: uuid.UUID, event_id: uuid.UUID) -> Favorite:
        favorite = Favorite(user_id=user_id, event_id=event_id)
        self.session.add(favorite)
        await self.session.flush()
        return favorite

    async def delete(self, favorite: Favorite) -> None:
        await self.session.delete(favorite)
        await self.session.flush()

    async def list_events(
        self,
        user_id: uuid.UUID,
        page: int,
        limit: int,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ) -> tuple[Sequence[Event], int, int]:
        filters = [Favorite.user_id == user_id, Event.is_deleted.is_(False)]
        total = int(
            await self.session.scalar(
                select(func.count()).select_from(Favorite).join(Event).where(*filters)
            )
            or 0
        )
        sort_column = Favorite.created_at if sort_by == "date" else Event.title
        ordering = (
            sort_column.asc() if sort_order == "asc" else sort_column.desc(),
            Event.id,
        )
        result = await self.session.execute(
            select(Event)
            .join(Favorite, Favorite.event_id == Event.id)
            .options(joinedload(Event.organizer))
            .where(*filters)
            .order_by(*ordering)
            .offset((page - 1) * limit)
            .limit(limit)
        )
        from math import ceil

        return result.scalars().all(), total, ceil(total / limit) if total else 1
