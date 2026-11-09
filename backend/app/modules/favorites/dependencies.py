from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.dependencies import get_event_repository
from app.modules.events.repository import EventRepository
from app.modules.favorites.repository import FavoriteRepository
from app.modules.favorites.service import FavoriteService


def get_favorite_repository(session: SessionDep) -> FavoriteRepository:
    return FavoriteRepository(session)


def get_favorite_service(
    favorite_repo: Annotated[FavoriteRepository, Depends(get_favorite_repository)],
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
) -> FavoriteService:
    return FavoriteService(favorite_repo, event_repo)
