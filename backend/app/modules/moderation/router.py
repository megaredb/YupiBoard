import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.modules.auth.dependencies import get_current_superuser
from app.modules.events.models import EventStatus
from app.modules.events.schemas import EventRead
from app.modules.moderation.dependencies import get_moderation_service
from app.modules.moderation.schemas import (
    AdminAuditLogPage,
    EventRejectRequest,
    ModerationQueuePage,
)
from app.modules.moderation.service import ModerationService
from app.modules.users.models import User

router = APIRouter(
    prefix="/moderation",
    tags=["moderation"],
    dependencies=[Depends(get_current_superuser)],
)


@router.get(
    "/events",
    response_model=ModerationQueuePage,
    summary="List events awaiting or matching moderation status (admin only)",
)
async def list_moderation_events(
    service: Annotated[ModerationService, Depends(get_moderation_service)],
    event_status: Annotated[
        EventStatus | None, Query(alias="status")
    ] = EventStatus.ON_MODERATION,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> ModerationQueuePage:
    return await service.list_queue(status=event_status, page=page, limit=limit)


@router.post(
    "/events/{event_id}/approve",
    response_model=EventRead,
    summary="Approve an event in moderation and publish it (admin only)",
)
async def approve_event(
    event_id: uuid.UUID,
    admin: Annotated[User, Depends(get_current_superuser)],
    service: Annotated[ModerationService, Depends(get_moderation_service)],
) -> EventRead:
    return await service.approve_event(event_id, admin)


@router.post(
    "/events/{event_id}/reject",
    response_model=EventRead,
    summary="Reject an event in moderation with mandatory reason (admin only)",
)
async def reject_event(
    event_id: uuid.UUID,
    payload: EventRejectRequest,
    admin: Annotated[User, Depends(get_current_superuser)],
    service: Annotated[ModerationService, Depends(get_moderation_service)],
) -> EventRead:
    return await service.reject_event(event_id, admin, payload.reason)


@router.get(
    "/audit-logs",
    response_model=AdminAuditLogPage,
    summary="List administrative moderation audit logs (admin only)",
)
async def list_audit_logs(
    service: Annotated[ModerationService, Depends(get_moderation_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    target_entity: Annotated[str | None, Query()] = None,
    action_type: Annotated[str | None, Query()] = None,
) -> AdminAuditLogPage:
    return await service.list_audit_logs(
        page=page,
        limit=limit,
        target_entity=target_entity,
        action_type=action_type,
    )
