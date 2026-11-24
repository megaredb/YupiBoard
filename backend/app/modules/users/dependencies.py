from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.core.mail import MailService
from app.core.storage.base import BaseStorage
from app.core.storage.service import get_storage
from app.modules.auth.repository import ActionTokenRepository, RefreshTokenRepository
from app.modules.bookings.repository import BookingRepository
from app.modules.bookings.service import BookingService
from app.modules.events.repository import EventRepository
from app.modules.favorites.repository import FavoriteRepository
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService
from app.modules.users.repository import UserRepository
from app.modules.users.service import UserService


def get_user_repository(session: SessionDep) -> UserRepository:
    return UserRepository(session)


def get_token_repository(session: SessionDep) -> RefreshTokenRepository:
    return RefreshTokenRepository(session)


def get_user_service(
    session: SessionDep,
    user_repo: Annotated[UserRepository, Depends(get_user_repository)],
    token_repo: Annotated[RefreshTokenRepository, Depends(get_token_repository)],
    storage: Annotated[BaseStorage, Depends(get_storage)],
) -> UserService:
    event_repo = EventRepository(session)
    booking_repo = BookingRepository(session)
    notification_repo = NotificationRepository(session)
    notification_service = NotificationService(notification_repo)
    booking_service = BookingService(
        booking_repo, event_repo, notification_service=notification_service
    )
    return UserService(
        user_repo=user_repo,
        token_repo=token_repo,
        action_token_repo=ActionTokenRepository(session),
        mail_service=MailService(),
        event_repo=event_repo,
        booking_repo=booking_repo,
        booking_service=booking_service,
        favorite_repo=FavoriteRepository(session),
        notification_repo=notification_repo,
        notification_service=notification_service,
        storage=storage,
    )
