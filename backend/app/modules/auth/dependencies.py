import uuid
from typing import Annotated

from fastapi import Cookie, Depends, Header
from fastapi.security import OAuth2PasswordBearer

from app.core.database import SessionDep
from app.core.exceptions import ForbiddenException, UnauthorizedException
from app.core.mail import MailService
from app.core.security import decode_token
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.service import AuthService
from app.modules.users.dependencies import get_user_repository, get_user_service
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)


def get_mail_service() -> MailService:
    return MailService()


def get_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_auth_service(
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    token_repo: Annotated[RefreshTokenRepository, Depends(get_token_repository)],
    mail_service: Annotated[MailService, Depends(get_mail_service)],
) -> AuthService:
    return AuthService(
        user_repo=user_repo, token_repo=token_repo, mail_service=mail_service
    )


async def get_token_from_request(
    auth_header: Annotated[str | None, Header(alias="Authorization")] = None,
    cookie_token: Annotated[str | None, Cookie(alias="access_token")] = None,
) -> str:
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.removeprefix("Bearer ").strip()
    if cookie_token:
        return cookie_token
    raise UnauthorizedException("Authentication required")


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

    user = await user_service.get_by_id(user_id)
    if not user.is_active:
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
