import uuid
from typing import Literal

from app.core.exceptions import ConflictException, NotFoundException
from app.modules.events.repository import EventRepository
from app.modules.events.service import EventService
from app.modules.favorites.repository import FavoriteRepository


class FavoriteService:
    def __init__(
        self, favorite_repo: FavoriteRepository, event_repo: EventRepository
    ) -> None:
        self.favorite_repo = favorite_repo
        self.event_repo = event_repo

    async def add(self, user_id: uuid.UUID, event_id: uuid.UUID) -> None:
        event = await self.event_repo.get_by_id_with_organizer(event_id)
        if event is None:
            raise NotFoundException("Event not found")
        if await self.favorite_repo.get(user_id, event_id):
            raise ConflictException("Event is already in favorites")
        await self.favorite_repo.add(user_id, event_id)

    async def remove(self, user_id: uuid.UUID, event_id: uuid.UUID) -> None:
        favorite = await self.favorite_repo.get(user_id, event_id)
        if favorite is None:
            raise NotFoundException("Favorite not found")
        await self.favorite_repo.delete(favorite)

    async def list(
        self,
        user_id: uuid.UUID,
        page: int,
        limit: int,
        sort_by: Literal["date", "name"] = "date",
        sort_order: Literal["asc", "desc"] = "desc",
    ):
        events, total, total_pages = await self.favorite_repo.list_events(
            user_id, page, limit, sort_by, sort_order
        )
        converter = EventService(self.event_repo)
        return {
            "items": [converter._to_list_item(event, None) for event in events],
            "total": total,
            "page": page,
            "total_pages": total_pages,
        }
