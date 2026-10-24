import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import get_current_superuser, get_current_user, get_user_service
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    PasswordChangeRequest,
    UserCreate,
    UserRead,
    UserUpdate,
)
from app.services.user import UserService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserRead:
    return UserRead.model_validate(current_user)


@router.patch("/me", response_model=UserRead)
async def update_current_user_profile(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    updated = await user_service.update_profile(current_user, data)
    return UserRead.model_validate(updated)


@router.post("/me/password", response_model=MessageResponse)
async def change_current_user_password(
    data: PasswordChangeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> MessageResponse:
    await user_service.change_password(
        current_user, data.current_password, data.new_password
    )
    return MessageResponse(message="Password changed successfully")


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> None:
    await user_service.delete(current_user)


@router.get(
    "",
    response_model=list[UserRead],
    dependencies=[Depends(get_current_superuser)],
)
async def list_users(
    user_service: Annotated[UserService, Depends(get_user_service)],
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 100,
) -> list[UserRead]:
    users = await user_service.list_users(skip=skip, limit=limit)
    return [UserRead.model_validate(user) for user in users]


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(get_current_superuser)],
)
async def create_user(
    data: UserCreate,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await user_service.create(data)
    return UserRead.model_validate(user)


@router.get(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(get_current_superuser)],
)
async def get_user(
    user_id: uuid.UUID,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await user_service.get_by_id(user_id)
    return UserRead.model_validate(user)


@router.patch(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(get_current_superuser)],
)
async def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> UserRead:
    user = await user_service.get_by_id(user_id)
    updated = await user_service.update_profile(user, data)
    return UserRead.model_validate(updated)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_superuser)],
)
async def delete_user(
    user_id: uuid.UUID,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> None:
    user = await user_service.get_by_id(user_id)
    await user_service.delete(user)
