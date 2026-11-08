import uuid
from collections.abc import Sequence

from app.core.exceptions import NotFoundException
from app.modules.notifications.enums import (
    NOTIFICATION_CATEGORY,
    NotificationCategory,
    types_for,
)
from app.modules.notifications.models import Notification
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.schemas import (
    CategoryCount,
    NotificationCountsRead,
    NotificationCreate,
    NotificationFilterParams,
)


class NotificationService:
    def __init__(self, notification_repo: NotificationRepository) -> None:
        self.notification_repo = notification_repo

    async def notify(self, data: NotificationCreate) -> Notification:
        """Called by other modules' services."""
        return await self.notification_repo.create_notification(
            user_id=data.user_id,
            notification_type=data.notification_type,
            title=data.title,
            message=data.message,
            metadata_payload=data.metadata_payload,
        )

    async def notify_many(
        self, items: Sequence[NotificationCreate]
    ) -> Sequence[Notification]:
        """Store several notifications in one flush (e.g. fan-out to attendees)."""
        if not items:
            return []
        return await self.notification_repo.create_many(
            [
                {
                    "user_id": item.user_id,
                    "notification_type": item.notification_type,
                    "title": item.title,
                    "message": item.message,
                    "metadata_payload": item.metadata_payload,
                }
                for item in items
            ]
        )

    async def list_for_user(
        self, user_id: uuid.UUID, filters: NotificationFilterParams
    ) -> tuple[Sequence[Notification], int, int]:
        types = types_for(filters.category) if filters.category else None
        return await self.notification_repo.list_for_user(
            user_id,
            types=types,
            is_read=filters.is_read,
            page=filters.page,
            limit=filters.limit,
        )

    async def get_counts(self, user_id: uuid.UUID) -> NotificationCountsRead:
        by_category = {
            category: CategoryCount(total=0, unread=0)
            for category in NotificationCategory
        }
        rows = await self.notification_repo.count_by_type(user_id)
        for notification_type, total, unread in rows:
            bucket = by_category[NOTIFICATION_CATEGORY[notification_type]]
            bucket.total += total
            bucket.unread += unread
        return NotificationCountsRead(
            total=sum(c.total for c in by_category.values()),
            unread=sum(c.unread for c in by_category.values()),
            by_category=by_category,
        )

    async def get_unread_count(self, user_id: uuid.UUID) -> int:
        return await self.notification_repo.count_unread(user_id)

    async def mark_as_read(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification:
        notification = await self.notification_repo.mark_read(notification_id, user_id)
        if notification is None:
            raise NotFoundException("Notification not found")
        return notification

    async def mark_as_unread(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification:
        notification = await self.notification_repo.mark_unread(
            notification_id, user_id
        )
        if notification is None:
            raise NotFoundException("Notification not found")
        return notification

    async def mark_many_as_read(
        self, notification_ids: Sequence[uuid.UUID], user_id: uuid.UUID
    ) -> int:
        return await self.notification_repo.mark_many_read(notification_ids, user_id)

    async def mark_all_as_read(self, user_id: uuid.UUID) -> int:
        return await self.notification_repo.mark_all_read(user_id)

    async def list_by_metadata(
        self,
        user_id: uuid.UUID,
        key: str,
        value: str | int | bool | uuid.UUID,
        *,
        is_read: bool | None = None,
    ) -> Sequence[Notification]:
        return await self.notification_repo.list_by_metadata(
            user_id, key, value, is_read=is_read
        )

    async def mark_as_read_by_metadata(
        self,
        user_id: uuid.UUID,
        key: str,
        value: str | int | bool | uuid.UUID,
    ) -> int:
        """Mark everything tied to a metadata pair (e.g. booking_id) as read."""
        return await self.notification_repo.mark_read_by_metadata(user_id, key, value)

    async def delete(self, notification_id: uuid.UUID, user_id: uuid.UUID) -> None:
        deleted = await self.notification_repo.delete_for_user(notification_id, user_id)
        if not deleted:
            raise NotFoundException("Notification not found")

    async def delete_all(self, user_id: uuid.UUID, *, only_read: bool = False) -> int:
        return await self.notification_repo.delete_all_for_user(
            user_id, only_read=only_read
        )

    async def purge_expired(self) -> int:
        """Retention cleanup (2 years). Meant for a scheduled job, not the API."""
        return await self.notification_repo.delete_expired()
