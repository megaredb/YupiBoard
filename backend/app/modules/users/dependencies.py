from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


def get_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_user_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    token_repo: Annotated[RefreshTokenRepository, Depends(get_token_repository)],
) -> UserService:
    return UserService(user_repo=user_repo, token_repo=token_repo)
