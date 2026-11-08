import uuid
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status

from app.modules.auth.dependencies import get_current_user
from app.modules.favorites.dependencies import get_favorite_service
from app.modules.favorites.schemas import FavoritePage
from app.modules.favorites.service import FavoriteService
from app.modules.users.models import User

router = APIRouter(tags=["favorites"])


@router.post("/events/{event_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def add_favorite(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> None:
    await service.add(current_user.id, event_id)


@router.delete("/events/{event_id}/favorite", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    event_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[FavoriteService, Depends(get_favorite_service)],
) -> None:
    await service.remove(current_user.id, event_id)


@router.get("/users/me/favorites", response_model=FavoritePage)
async def list_favorites(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[FavoriteService, Depends(get_favorite_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    sort_by: Annotated[Literal["date", "name"], Query()] = "date",
    sort_order: Annotated[Literal["asc", "desc"], Query()] = "desc",
) -> FavoritePage:
    return await service.list(current_user.id, page, limit, sort_by, sort_order)
