import uuid
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.database import SessionDep
from app.core.exceptions import (
    ForbiddenException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.mail import MailService
from app.core.security import decode_token
from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository
from app.modules.auth.service import AuthService
from app.modules.users.dependencies import get_user_repository, get_user_service
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService

security = HTTPBearer(auto_error=False)


def get_mail_service() -> MailService:
    return MailService()


def get_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_action_token_repository(session: SessionDep) -> ActionTokenRepository:
    return ActionTokenRepository(session)


def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    token_repo: Annotated[RefreshTokenRepository, Depends(get_token_repository)],
    mail_service: Annotated[MailService, Depends(get_mail_service)],
    action_token_repo: Annotated[
        ActionTokenRepository, Depends(get_action_token_repository)
    ],
) -> AuthService:
    return AuthService(
        user_repo=user_repo,
        token_repo=token_repo,
        mail_service=mail_service,
        action_token_repo=action_token_repo,
    )


async def get_token_from_request(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
) -> str:
    if credentials:
        return credentials.credentials
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    raise UnauthorizedException("Authentication required")


async def get_optional_token_from_request(
    request: Request,
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(security)
    ] = None,
) -> str | None:
    if credentials:
        return credentials.credentials
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        return cookie_token
    return None


async def get_optional_current_user(
    token: Annotated[str | None, Depends(get_optional_token_from_request)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token, expected_type="access")
        user_id_str = payload.get("sub")
        if not user_id_str:
            return None
        user_id = uuid.UUID(user_id_str)
        user = await user_service.get_by_id(user_id)
        if user.status != UserStatus.ACTIVE or user.is_deleted:
            return None
        return user
    except Exception:  # noqa: BLE001
        return None


async def get_current_user(
    token: Annotated[str, Depends(get_token_from_request)],
    user_service: Annotated[UserService, Depends(get_user_service)],
) -> User:
    payload = decode_token(token, expected_type="access")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException("Invalid token")

    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise UnauthorizedException("Invalid user identifier")

    try:
        user = await user_service.get_by_id(user_id)
    except NotFoundException:
        raise UnauthorizedException("User not found")

    if user.status == UserStatus.BANNED:
        raise ForbiddenException("User account is banned")
    if user.status != UserStatus.ACTIVE or user.is_deleted:
        raise UnauthorizedException("User account is deactivated")
    return user


async def get_current_verified_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_verified:
        raise ForbiddenException("Email address verification required")
    return current_user


async def get_current_superuser(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_superuser:
        raise ForbiddenException("Administrative privileges required")
    return current_user
