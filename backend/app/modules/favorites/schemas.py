from pydantic import BaseModel

from app.modules.events.schemas import EventListItem


class FavoritePage(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    total_pages: int
