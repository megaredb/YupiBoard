from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, Response, status

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.core.schemas import MessageResponse
from app.modules.auth.dependencies import get_auth_service
from app.modules.auth.schemas import (
    EmailVerifyRequest,
    GoogleAuthRequest,
    LoginRequest,
    PasswordResetConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.modules.auth.service import AuthService
from app.modules.users.schemas import UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/api/v1/auth",
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
    )


@router.post(
    "/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    data: RegisterRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user, access_token, refresh_token = await auth_service.register(data)
    _set_auth_cookies(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user, access_token, refresh_token = await auth_service.authenticate(data)
    _set_auth_cookies(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_tokens(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    body_data: RefreshRequest | None = None,
    cookie_refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> TokenResponse:
    raw_token = (
        body_data.refresh_token if body_data and body_data.refresh_token else None
    ) or cookie_refresh_token
    if not raw_token:
        raise UnauthorizedException("Refresh token missing")

    user, new_access_token, new_refresh_token = await auth_service.refresh_tokens(
        raw_token
    )
    _set_auth_cookies(response, new_refresh_token)
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
    body_data: RefreshRequest | None = None,
    cookie_refresh_token: Annotated[str | None, Cookie(alias="refresh_token")] = None,
) -> MessageResponse:
    raw_token = (
        body_data.refresh_token if body_data and body_data.refresh_token else None
    ) or cookie_refresh_token
    await auth_service.logout(raw_token, None)
    _clear_auth_cookies(response)
    return MessageResponse(message="Successfully logged out")


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    data: GoogleAuthRequest,
    response: Response,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    user, access_token, refresh_token = await auth_service.google_authenticate(
        data.id_token
    )
    _set_auth_cookies(response, refresh_token)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/verify-email", response_model=UserRead)
async def verify_email(
    data: EmailVerifyRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UserRead:
    user = await auth_service.verify_email(data.token)
    return UserRead.model_validate(user)


@router.post("/password-recovery", response_model=MessageResponse)
async def password_recovery(
    data: PasswordResetRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    await auth_service.request_password_reset(data.email)
    return MessageResponse(
        message="If an account with this email exists, password recovery instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    data: PasswordResetConfirmRequest,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> MessageResponse:
    await auth_service.confirm_password_reset(data.token, data.new_password)
    return MessageResponse(message="Password changed successfully")
