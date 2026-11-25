import logging
import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING

from app.core.config import settings
from app.core.exceptions import (
    BadRequestException,
    ConflictException,
    NotFoundException,
)
from app.core.mail import MailService
from app.core.media_url import normalize_stored_media_url
from app.core.realtime import RealtimeBroker, realtime_broker
from app.core.security import (
    create_action_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from app.core.storage.base import BaseStorage
from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserUpdate

if TYPE_CHECKING:
    from app.modules.bookings.repository import BookingRepository
    from app.modules.bookings.service import BookingService
    from app.modules.events.repository import EventRepository
    from app.modules.favorites.repository import FavoriteRepository

logger = logging.getLogger("yupiboard.users")


class UserService:
    def __init__(
        self,
        user_repo: UserRepository,
        token_repo: RefreshTokenRepository | None = None,
        *,
        action_token_repo: ActionTokenRepository | None = None,
        mail_service: MailService | None = None,
        event_repo: EventRepository | None = None,
        booking_repo: BookingRepository | None = None,
        booking_service: BookingService | None = None,
        favorite_repo: FavoriteRepository | None = None,
        notification_repo: NotificationRepository | None = None,
        notification_service: NotificationService | None = None,
        storage: BaseStorage | None = None,
        realtime: RealtimeBroker | None = None,
    ) -> None:
        self.user_repo = user_repo
        self.token_repo = token_repo
        self.action_token_repo = action_token_repo
        self.mail_service = mail_service
        self.event_repo = event_repo
        self.booking_repo = booking_repo
        self.booking_service = booking_service
        self.favorite_repo = favorite_repo
        self.notification_repo = notification_repo
        self.notification_service = notification_service
        self.storage = storage
        self.realtime = realtime if realtime is not None else realtime_broker

    async def get_by_id(self, user_id: uuid.UUID) -> User:
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        return user

    async def list_users(self, skip: int = 0, limit: int = 100) -> Sequence[User]:
        return await self.user_repo.get_all(skip=skip, limit=limit)

    async def update_profile(self, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        for field in ("avatar_url", "banner_url"):
            if field in update_data and update_data[field] is not None:
                update_data[field] = normalize_stored_media_url(update_data[field])
        # The first save that leaves both names set is the "complete profile" step: users who
        # have not completed it are kept on that screen and never reach the regular edit form.
        first_name = update_data.get("first_name", user.first_name)
        last_name = update_data.get("last_name", user.last_name)
        if user.profile_completed_at is None and first_name and last_name:
            update_data["profile_completed_at"] = datetime.now(UTC)
        # exclude_none=False: an explicit null in the request clears the field
        return await self.user_repo.update(user, exclude_none=False, **update_data)

    async def change_password(
        self, user: User, new_password: str, old_password: str | None = None
    ) -> User:
        if user.hashed_password is None:
            # Accounts created through Google have no password to confirm; setting one here
            # would let anyone holding a session take over the login, so they use the e-mailed
            # password reset instead.
            raise BadRequestException(
                "This account has no password yet; set one through password reset"
            )
        if not old_password:
            raise BadRequestException("Current password is required")
        try:
            is_valid = verify_password(old_password, user.hashed_password)
        except Exception:  # noqa: BLE001
            is_valid = False
        if not is_valid:
            raise BadRequestException("Invalid old password")

        hashed_password = get_password_hash(new_password)
        updated_user = await self.user_repo.update(
            user, hashed_password=hashed_password
        )
        if self.token_repo:
            await self.token_repo.revoke_all_for_user(user.id)
        return updated_user

    async def request_email_change(
        self,
        user: User,
        new_email: str,
        current_password: str | None = None,
    ) -> None:
        normalized_email = new_email.strip().lower()
        if normalized_email == user.email.lower():
            raise BadRequestException(
                "New email must be different from your current email"
            )

        if user.hashed_password is not None:
            if not current_password:
                raise BadRequestException("Current password is required")
            try:
                is_valid = verify_password(current_password, user.hashed_password)
            except Exception:  # noqa: BLE001
                is_valid = False
            if not is_valid:
                raise BadRequestException("Invalid password")

        existing = await self.user_repo.get_by_email(normalized_email)
        if existing is not None:
            raise ConflictException("User with this email is already registered")

        if self.action_token_repo is not None:
            await self.action_token_repo.invalidate_all_for_user(
                user.id, token_type="change_email"
            )

        token = create_action_token(
            subject=str(user.id),
            action="change_email",
            expires_delta=timedelta(hours=settings.EMAIL_CHANGE_TOKEN_EXPIRE_HOURS),
            additional_claims={"new_email": normalized_email},
        )
        payload = decode_token(token, expected_type="change_email")
        jti = payload["jti"]
        expires_at = datetime.fromtimestamp(payload["exp"], tz=UTC)

        if self.action_token_repo is not None:
            await self.action_token_repo.create(
                jti=jti,
                user_id=user.id,
                token_type="change_email",
                is_used=False,
                expires_at=expires_at,
            )

        if self.mail_service is not None:
            await self.mail_service.send_email_change_confirmation(
                normalized_email, token
            )
            await self.mail_service.send_email_change_notice(
                user.email, normalized_email
            )

    async def delete(self, user: User, *, force_cancel_events: bool = False) -> None:
        if self.event_repo is not None:
            active_events = await self.event_repo.list_active_for_organizer(user.id)
            if active_events:
                if not force_cancel_events:
                    raise ConflictException(
                        "Cannot delete account while you have active or upcoming "
                        "organized events. Please cancel or complete them first."
                    )
                for event in active_events:
                    recipient_ids = await self.event_repo.get_active_booking_user_ids(
                        event.id
                    )
                    cancelled_event = await self.event_repo.cancel_event(event)
                    if self.notification_service is not None and recipient_ids:
                        await self.notification_service.notify_many(
                            [
                                NotificationCreate(
                                    user_id=recipient_id,
                                    notification_type=NotificationType.EVENT_CANCELLED,
                                    title="Event Cancelled",
                                    message=(
                                        f"The event {event.title} has been cancelled."
                                    ),
                                    metadata_payload={"event_id": str(event.id)},
                                )
                                for recipient_id in recipient_ids
                            ]
                        )
                    await self.realtime.publish_event_update(
                        event.id,
                        "event.updated",
                        {
                            "event_id": str(event.id),
                            "status": cancelled_event.status.value,
                            "current_confirmed": cancelled_event.current_confirmed,
                            "available_seats": max(
                                0,
                                cancelled_event.max_players
                                - cancelled_event.current_confirmed,
                            ),
                            "is_verified": cancelled_event.is_verified,
                        },
                    )

        if self.booking_repo is not None and self.booking_service is not None:
            upcoming_bookings = await self.booking_repo.list_active_upcoming_for_user(
                user.id
            )
            for booking in upcoming_bookings:
                await self.booking_service.cancel_for_player(booking.event_id, user.id)

        if self.token_repo is not None:
            await self.token_repo.revoke_all_for_user(user.id)
        if self.action_token_repo is not None:
            await self.action_token_repo.invalidate_all_types_for_user(user.id)
        if self.favorite_repo is not None:
            await self.favorite_repo.delete_all_for_user(user.id)
        if self.notification_repo is not None:
            await self.notification_repo.delete_all_for_user(user.id)

        if self.storage is not None:
            for media_url in (user.avatar_url, user.banner_url):
                if media_url:
                    try:
                        await self.storage.delete(media_url)
                    except Exception as exc:  # noqa: BLE001
                        logger.warning(
                            "Failed to delete media %s for user %s: %s",
                            media_url,
                            user.id,
                            exc,
                        )

        await self.user_repo.soft_delete(user)
