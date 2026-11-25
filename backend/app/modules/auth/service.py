import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)
from app.core.mail import MailService
from app.core.security import (
    create_access_token,
    create_action_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository
from app.modules.auth.schemas import (
    ActionTokenValidationResponse,
    LoginRequest,
    RegisterRequest,
)
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

# Matches the `users.first_name` / `last_name` column length.
NAME_MAX_LENGTH = 50


def _google_names(claims: dict[str, Any]) -> tuple[str | None, str | None]:
    """First and last name from Google's claims, split from `name` when the parts are missing."""
    given_name = claims.get("given_name")
    family_name = claims.get("family_name")
    name = claims.get("name")
    if not given_name and name:
        parts = name.strip().split(" ", 1)
        given_name = parts[0]
        family_name = family_name or (parts[1] if len(parts) > 1 else None)

    def clean(value: str | None) -> str | None:
        return (value.strip()[:NAME_MAX_LENGTH] or None) if value else None

    return clean(given_name), clean(family_name)


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository,
        mail_service: MailService,
        action_token_repo: ActionTokenRepository | None = None,
    ) -> None:
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.mail_service = mail_service
        self.action_token_repo = action_token_repo

    async def _issue_tokens(self, user: User) -> tuple[str, str]:
        access_token = create_access_token(
            subject=str(user.id),
            additional_claims={"email": user.email, "is_verified": user.is_verified},
        )
        refresh_token = create_refresh_token(subject=str(user.id))
        token_digest = hash_token(refresh_token)
        expires_at = datetime.now(UTC) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

        await self.token_repo.create(
            token_hash=token_digest,
            user_id=user.id,
            expires_at=expires_at,
        )
        return access_token, refresh_token

    async def register(self, data: RegisterRequest) -> tuple[User, str, str]:
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise ConflictException("User with this email is already registered")

        hashed_pwd = get_password_hash(data.password)
        user = await self.user_repo.create(
            email=data.email.strip().lower(),
            hashed_password=hashed_pwd,
            first_name=data.first_name,
            last_name=data.last_name,
            is_verified=False,
            is_superuser=False,
        )

        # Generate verification token and send mail
        verification_token = create_action_token(
            subject=str(user.id),
            action="verify_email",
        )
        await self.mail_service.send_verification_email(user.email, verification_token)

        access_token, refresh_token = await self._issue_tokens(user)
        return user, access_token, refresh_token

    async def authenticate(self, data: LoginRequest) -> tuple[User, str, str]:
        user = await self.user_repo.get_by_email(data.email)
        if not user or not user.hashed_password:
            raise UnauthorizedException("Invalid email or password")

        if not verify_password(data.password, user.hashed_password):
            raise UnauthorizedException("Invalid email or password")

        if user.status != UserStatus.ACTIVE or user.is_deleted:
            raise UnauthorizedException("Account is deactivated")

        access_token, refresh_token = await self._issue_tokens(user)
        return user, access_token, refresh_token

    async def refresh_tokens(self, refresh_token_str: str) -> tuple[User, str, str]:
        payload = decode_token(refresh_token_str, expected_type="refresh")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise UnauthorizedException("Invalid token")

        token_digest = hash_token(refresh_token_str)
        stored_token = await self.token_repo.get_by_hash(token_digest)
        if not stored_token or stored_token.revoked:
            raise UnauthorizedException("Session expired or token revoked")

        if stored_token.expires_at < datetime.now(UTC):
            await self.token_repo.revoke(stored_token)
            raise UnauthorizedException("Token expired")

        # Rotate token
        await self.token_repo.revoke(stored_token)

        user_id = uuid.UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_deleted:
            raise UnauthorizedException("User not found or deactivated")

        new_access_token, new_refresh_token = await self._issue_tokens(user)
        return user, new_access_token, new_refresh_token

    async def logout(
        self, refresh_token_str: str | None, user_id: uuid.UUID | None
    ) -> None:
        if refresh_token_str:
            token_digest = hash_token(refresh_token_str)
            stored_token = await self.token_repo.get_by_hash(token_digest)
            if stored_token:
                await self.token_repo.revoke(stored_token)
        elif user_id:
            await self.token_repo.revoke_all_for_user(user_id)

    async def verify_email(self, token_str: str) -> User:
        payload = decode_token(token_str, expected_type="verify_email")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise BadRequestException("Invalid email verification token")

        user_id = uuid.UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        if user.is_verified:
            return user

        return await self.user_repo.update(user, is_verified=True)

    async def request_password_reset(self, email: str) -> None:
        user = await self.user_repo.get_by_email(email.strip().lower())
        if not user:
            # Don't leak user existence
            return

        if self.action_token_repo:
            await self.action_token_repo.invalidate_all_for_user(
                user.id, token_type="reset_password"
            )

        reset_token = create_action_token(subject=str(user.id), action="reset_password")
        payload = decode_token(reset_token, expected_type="reset_password")
        jti = payload["jti"]
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)

        if self.action_token_repo:
            await self.action_token_repo.create(
                jti=jti,
                user_id=user.id,
                token_type="reset_password",
                is_used=False,
                expires_at=expires_at,
            )

        await self.mail_service.send_password_reset_email(user.email, reset_token)

    async def confirm_password_reset(self, token_str: str, new_password: str) -> User:
        try:
            payload = decode_token(token_str, expected_type="reset_password")
        except UnauthorizedException as e:
            raise BadRequestException(f"Invalid password reset token: {e.detail}")

        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        if not user_id_str or not jti:
            raise BadRequestException("Invalid password reset token")

        user_id = uuid.UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        if self.action_token_repo:
            action_token = await self.action_token_repo.get_by_jti(jti)
            if (
                not action_token
                or action_token.token_type != "reset_password"
                or action_token.user_id != user.id
            ):
                raise BadRequestException(
                    "Invalid or unrecognized password reset token"
                )
            if action_token.is_used:
                raise BadRequestException("Password reset token has already been used")
            if action_token.expires_at < datetime.now(UTC):
                raise BadRequestException("Password reset token has expired")

            await self.action_token_repo.mark_used(action_token)

        hashed_pwd = get_password_hash(new_password)
        updated_user = await self.user_repo.update(user, hashed_password=hashed_pwd)
        # Revoke all previous refresh tokens on password change
        await self.token_repo.revoke_all_for_user(user.id)
        return updated_user

    async def validate_action_token(
        self,
        token_str: str,
        expected_action: Literal["reset_password", "change_email"],
    ) -> ActionTokenValidationResponse:
        """Check whether a password-reset or email-change token is still usable without consuming it."""
        try:
            payload = jwt.decode(
                token_str,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
        except jwt.ExpiredSignatureError:
            return ActionTokenValidationResponse(valid=False, reason="expired")
        except jwt.InvalidTokenError:
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        if payload.get("type") != expected_action:
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        if not user_id_str or not jti:
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        if expected_action == "change_email" and not payload.get("new_email"):
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        user = await self.user_repo.get_by_id(user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_deleted:
            return ActionTokenValidationResponse(valid=False, reason="invalid")

        if self.action_token_repo is not None:
            action_token = await self.action_token_repo.get_by_jti(jti)
            if (
                not action_token
                or action_token.token_type != expected_action
                or action_token.user_id != user.id
            ):
                return ActionTokenValidationResponse(valid=False, reason="invalid")
            if action_token.is_used:
                return ActionTokenValidationResponse(valid=False, reason="used")
            if action_token.expires_at < datetime.now(UTC):
                return ActionTokenValidationResponse(valid=False, reason="expired")

        return ActionTokenValidationResponse(valid=True, reason="valid")

    async def confirm_email_change(self, token_str: str) -> User:
        try:
            payload = decode_token(token_str, expected_type="change_email")
        except UnauthorizedException as e:
            raise BadRequestException(f"Invalid email change token: {e.detail}")

        user_id_str = payload.get("sub")
        jti = payload.get("jti")
        raw_new_email = payload.get("new_email")
        if not user_id_str or not jti or not isinstance(raw_new_email, str):
            raise BadRequestException("Invalid email change token")

        new_email = raw_new_email.strip().lower()
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise BadRequestException("Invalid email change token")

        user = await self.user_repo.get_by_id(user_id)
        if not user or user.status != UserStatus.ACTIVE or user.is_deleted:
            raise NotFoundException("User not found")

        if self.action_token_repo is not None:
            action_token = await self.action_token_repo.get_by_jti(jti)
            if (
                not action_token
                or action_token.token_type != "change_email"
                or action_token.user_id != user.id
            ):
                raise BadRequestException("Invalid or unrecognized email change token")
            if action_token.is_used:
                raise BadRequestException("Email change token has already been used")
            if action_token.expires_at < datetime.now(UTC):
                raise BadRequestException("Email change token has expired")

            existing = await self.user_repo.get_by_email(new_email)
            if existing is not None and existing.id != user.id:
                raise ConflictException("Email address is already in use")

            await self.action_token_repo.mark_used(action_token)
        else:
            existing = await self.user_repo.get_by_email(new_email)
            if existing is not None and existing.id != user.id:
                raise ConflictException("Email address is already in use")

        updated_user = await self.user_repo.update(
            user, email=new_email, is_verified=True
        )
        await self.token_repo.revoke_all_for_user(user.id)
        return updated_user

    async def google_authenticate(self, id_token_str: str) -> tuple[User, str, str]:
        if not settings.GOOGLE_CLIENT_ID:
            raise BadRequestException(
                "Google authentication is not configured on the server"
            )

        try:
            req = google_requests.Request()
            claims = google_id_token.verify_oauth2_token(
                id_token_str, req, audience=settings.GOOGLE_CLIENT_ID
            )
        except (ValueError, GoogleAuthError) as e:
            raise BadRequestException(f"Failed to verify Google token: {e}")

        if claims.get("aud") != settings.GOOGLE_CLIENT_ID:
            raise BadRequestException("Token audience does not match GOOGLE_CLIENT_ID")

        if claims.get("email_verified") is not True:
            raise BadRequestException("Google account email is not verified")

        email = claims.get("email")
        google_sub = claims.get("sub")
        picture = claims.get("picture")

        if not email or not google_sub:
            raise BadRequestException("Missing required claims in Google token")

        normalized_email = email.strip().lower()

        user = await self.user_repo.get_by_google_sub(google_sub)
        if not user:
            user = await self.user_repo.get_by_email(normalized_email)
            if user:
                if user.google_sub is not None and user.google_sub != google_sub:
                    raise ConflictException(
                        "Email is already linked to another Google account"
                    )
                first_name, last_name = _google_names(claims)
                user = await self.user_repo.update(
                    user,
                    google_sub=google_sub,
                    first_name=user.first_name or first_name,
                    last_name=user.last_name or last_name,
                    avatar_url=user.avatar_url or picture,
                    is_verified=True,
                )
            else:
                first_name, last_name = _google_names(claims)
                user = await self.user_repo.create(
                    email=normalized_email,
                    first_name=first_name,
                    last_name=last_name,
                    google_sub=google_sub,
                    avatar_url=picture,
                    is_verified=True,
                    is_superuser=False,
                )

        if user.status != UserStatus.ACTIVE or user.is_deleted:
            raise UnauthorizedException("Account is deactivated")

        access_token, refresh_token = await self._issue_tokens(user)
        return user, access_token, refresh_token
