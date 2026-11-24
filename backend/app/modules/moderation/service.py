import uuid
from datetime import UTC, datetime

from app.core.exceptions import ConflictException, NotFoundException
from app.core.realtime import RealtimeBroker, realtime_broker
from app.modules.events.models import Event, EventStatus
from app.modules.events.repository import EventRepository
from app.modules.events.schemas import EventRead, SortOrder
from app.modules.events.service import EventService
from app.modules.moderation.models import AuditActionType
from app.modules.moderation.repository import AuditLogRepository
from app.modules.moderation.schemas import (
    AdminAuditLogPage,
    AdminAuditLogRead,
    ModerationEventRead,
    ModerationQueuePage,
    ModerationSortBy,
)
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.schemas import NotificationCreate
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User


class ModerationService:
    def __init__(
        self,
        event_repo: EventRepository,
        audit_repo: AuditLogRepository,
        notification_service: NotificationService | None = None,
        realtime: RealtimeBroker | None = None,
    ) -> None:
        self.event_repo = event_repo
        self.audit_repo = audit_repo
        self.notification_service = notification_service
        self.realtime = realtime if realtime is not None else realtime_broker
        self._event_serializer = EventService(event_repo)

    async def list_queue(
        self,
        *,
        status: EventStatus | None = EventStatus.ON_MODERATION,
        query: str | None = None,
        sort_by: ModerationSortBy = ModerationSortBy.CREATED,
        sort_order: SortOrder = SortOrder.ASC,
        origin: tuple[float, float] | None = None,
        page: int = 1,
        limit: int = 20,
    ) -> ModerationQueuePage:
        events, total, total_pages = await self.event_repo.list_for_moderation(
            status=status,
            query=query,
            sort_by=sort_by.value,
            descending=sort_order == SortOrder.DESC,
            origin=origin,
            page=page,
            limit=limit,
        )
        items = [self._to_queue_item(event) for event in events]
        return ModerationQueuePage(
            items=items, total=total, page=page, total_pages=total_pages
        )

    def _to_queue_item(self, event: Event) -> ModerationEventRead:
        moderator = event.moderated_by
        moderator_name = (
            " ".join(
                part for part in (moderator.first_name, moderator.last_name) if part
            )
            or None
            if moderator is not None and not moderator.is_deleted
            else None
        )
        event_read = self._event_serializer.serialize_event(event)
        # Copied field by field: `model_dump()` would run the media URL serializers twice.
        return ModerationEventRead(
            **{name: getattr(event_read, name) for name in EventRead.model_fields},
            moderated_at=event.moderated_at,
            moderator_name=moderator_name,
        )

    async def approve_event(self, event_id: uuid.UUID, admin: User) -> EventRead:
        event = await self.event_repo.lock_event(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.status != EventStatus.ON_MODERATION:
            raise ConflictException("Event has already been reviewed")

        await self.event_repo.update(
            event,
            exclude_none=False,
            status=EventStatus.PUBLISHED,
            is_verified=True,
            rejection_reason=None,
            moderated_by_id=admin.id,
            moderated_at=datetime.now(UTC),
        )
        await self.audit_repo.create_log(
            admin_id=admin.id,
            action_type=AuditActionType.EVENT_APPROVED,
            target_entity="Event",
            target_id=event.id,
            justification_reason=None,
        )
        if self.notification_service is not None:
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=event.organizer_id,
                    notification_type=NotificationType.EVENT_APPROVED,
                    title="Event Approved",
                    message=f"Your event {event.title} has been approved and published.",
                    metadata_payload={"event_id": str(event.id)},
                )
            )
        await self.realtime.publish_event_update(
            event.id,
            "event.updated",
            {
                "event_id": str(event.id),
                "status": EventStatus.PUBLISHED.value,
                "current_confirmed": event.current_confirmed,
                "available_seats": max(0, event.max_players - event.current_confirmed),
                "is_verified": True,
            },
        )
        reloaded = await self.event_repo.get_by_id_with_organizer(event.id)
        return self._event_serializer.serialize_event(reloaded or event)

    async def reject_event(
        self, event_id: uuid.UUID, admin: User, reason: str
    ) -> EventRead:
        event = await self.event_repo.lock_event(event_id)
        if event is None or event.is_deleted:
            raise NotFoundException("Event not found")
        if event.status != EventStatus.ON_MODERATION:
            raise ConflictException("Event has already been reviewed")

        clean_reason = reason.strip()
        await self.event_repo.update(
            event,
            exclude_none=False,
            status=EventStatus.REJECTED,
            is_verified=False,
            rejection_reason=clean_reason,
            moderated_by_id=admin.id,
            moderated_at=datetime.now(UTC),
        )
        await self.audit_repo.create_log(
            admin_id=admin.id,
            action_type=AuditActionType.EVENT_REJECTED,
            target_entity="Event",
            target_id=event.id,
            justification_reason=clean_reason,
        )
        if self.notification_service is not None:
            await self.notification_service.notify(
                NotificationCreate(
                    user_id=event.organizer_id,
                    notification_type=NotificationType.EVENT_REJECTED,
                    title="Event Rejected",
                    message=(f"Your event {event.title} was rejected: {clean_reason}"),
                    metadata_payload={
                        "event_id": str(event.id),
                        "reason": clean_reason,
                    },
                )
            )
        await self.realtime.publish_event_update(
            event.id,
            "event.updated",
            {
                "event_id": str(event.id),
                "status": EventStatus.REJECTED.value,
                "current_confirmed": event.current_confirmed,
                "available_seats": max(0, event.max_players - event.current_confirmed),
                "is_verified": False,
            },
        )
        reloaded = await self.event_repo.get_by_id_with_organizer(event.id)
        return self._event_serializer.serialize_event(reloaded or event)

    async def list_audit_logs(
        self,
        *,
        page: int = 1,
        limit: int = 20,
        target_entity: str | None = None,
        action_type: str | None = None,
    ) -> AdminAuditLogPage:
        rows, total, total_pages = await self.audit_repo.list_logs(
            page=page,
            limit=limit,
            target_entity=target_entity,
            action_type=action_type,
        )
        return AdminAuditLogPage(
            items=[AdminAuditLogRead.model_validate(row) for row in rows],
            total=total,
            page=page,
            total_pages=total_pages,
        )
