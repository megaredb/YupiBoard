from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.events.dependencies import get_event_repository
from app.modules.events.repository import EventRepository
from app.modules.moderation.repository import AuditLogRepository
from app.modules.moderation.service import ModerationService
from app.modules.notifications.dependencies import get_notification_service
from app.modules.notifications.service import NotificationService


def get_audit_log_repository(session: SessionDep) -> AuditLogRepository:
    return AuditLogRepository(session)


def get_moderation_service(
    event_repo: Annotated[EventRepository, Depends(get_event_repository)],
    audit_repo: Annotated[AuditLogRepository, Depends(get_audit_log_repository)],
    notification_service: Annotated[
        NotificationService, Depends(get_notification_service)
    ],
) -> ModerationService:
    return ModerationService(
        event_repo=event_repo,
        audit_repo=audit_repo,
        notification_service=notification_service,
    )
