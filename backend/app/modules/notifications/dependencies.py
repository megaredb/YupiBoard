from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService


def get_notification_repository(session: SessionDep) -> NotificationRepository:
    return NotificationRepository(session)


def get_notification_service(
    notification_repo: Annotated[
        NotificationRepository, Depends(get_notification_repository)
    ],
) -> NotificationService:
    return NotificationService(notification_repo)
