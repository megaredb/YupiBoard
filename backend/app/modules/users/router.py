from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status

from app.core.config import settings
from app.core.schemas import MessageResponse
from app.core.storage import MediaService, get_media_service
from app.core.types import UUID7
from app.modules.auth.dependencies import get_current_superuser, get_current_user
from app.modules.users.dependencies import get_user_service
from app.modules.users.models import User
from app.modules.users.schemas import (
    PasswordChangeRequest,
    UserRead,
    UserUpdate,
)
from app.modules.users.service import UserService

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


@router.post(
    "/me/change-password",
    response_model=MessageResponse,
    summary="Change password of current user",
)
async def change_password(
    data: PasswordChangeRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> MessageResponse:
    await user_service.change_password(current_user, data.new_password)
    return MessageResponse(message="Password successfully updated")


@router.post(
    "/me/avatar",
    response_model=UserRead,
    summary="Upload avatar image (max 2 MB, JPEG/PNG/WebP, converted to 512x512 WebP thumbnail)",
)
async def upload_avatar(
    file: Annotated[UploadFile, File(...)],
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
    media_service: Annotated[MediaService, Depends(get_media_service)],
) -> UserRead:
    avatar_url = await media_service.upload_avatar(file, current_user.id)
    updated = await user_service.update_profile(
        current_user, UserUpdate(avatar_url=avatar_url)
    )
    return UserRead.model_validate(updated)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    response: Response,
    current_user: Annotated[User, Depends(get_current_user)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> None:
    await user_service.delete(current_user)
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )


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


@router.get(
    "/{user_id}",
    response_model=UserRead,
)
async def get_user(
    user_id: UUID7,
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
    user_id: UUID7,
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
    user_id: UUID7,
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> None:
    user = await user_service.get_by_id(user_id)
    await user_service.delete(user)
