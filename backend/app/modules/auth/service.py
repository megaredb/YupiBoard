import uuid
from datetime import UTC, datetime, timedelta

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
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.schemas import LoginRequest, RegisterRequest
from app.modules.users.models import User
from app.modules.users.repository import UserRepository


class AuthService:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository,
        mail_service: MailService,
    ) -> None:
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.mail_service = mail_service

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
            full_name=data.full_name,
            is_active=True,
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

        if not user.is_active:
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
        if not user or not user.is_active:
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
        user = await self.user_repo.get_by_email(email)
        if not user:
            # Don't leak user existence
            return

        reset_token = create_action_token(subject=str(user.id), action="reset_password")
        await self.mail_service.send_password_reset_email(user.email, reset_token)

    async def confirm_password_reset(self, token_str: str, new_password: str) -> User:
        payload = decode_token(token_str, expected_type="reset_password")
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise BadRequestException("Invalid password reset token")

        user_id = uuid.UUID(user_id_str)
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")

        hashed_pwd = get_password_hash(new_password)
        updated_user = await self.user_repo.update(user, hashed_password=hashed_pwd)
        # Revoke all previous refresh tokens on password change
        await self.token_repo.revoke_all_for_user(user.id)
        return updated_user

    async def google_authenticate(self, id_token_str: str) -> tuple[User, str, str]:
        try:
            req = google_requests.Request()
            audience = settings.GOOGLE_CLIENT_ID if settings.GOOGLE_CLIENT_ID else None
            claims = google_id_token.verify_oauth2_token(
                id_token_str, req, audience=audience
            )
        except (ValueError, GoogleAuthError) as e:
            raise BadRequestException(f"Failed to verify Google token: {e}")

        email = claims.get("email")
        google_sub = claims.get("sub")
        name = claims.get("name")
        picture = claims.get("picture")

        if not email or not google_sub:
            raise BadRequestException("Missing required claims in Google token")

        user = await self.user_repo.get_by_google_sub(google_sub)
        if not user:
            user = await self.user_repo.get_by_email(email)
            if user:
                user = await self.user_repo.update(
                    user,
                    google_sub=google_sub,
                    avatar_url=picture or user.avatar_url,
                    is_verified=True,
                )
            else:
                user = await self.user_repo.create(
                    email=email.strip().lower(),
                    full_name=name,
                    google_sub=google_sub,
                    avatar_url=picture,
                    is_active=True,
                    is_verified=True,
                    is_superuser=False,
                )

        if not user.is_active:
            raise UnauthorizedException("Account is deactivated")

        access_token, refresh_token = await self._issue_tokens(user)
        return user, access_token, refresh_token
