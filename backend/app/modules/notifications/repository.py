import uuid
from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from math import ceil
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.repositories import BaseRepository
from app.modules.notifications.enums import NotificationType
from app.modules.notifications.models import Notification

NOTIFICATION_RETENTION = timedelta(days=730)


def _metadata_payload_filter(key: str, value: str | int | bool | uuid.UUID) -> Any:
    formatted_value = str(value) if isinstance(value, uuid.UUID) else value
    return Notification.metadata_payload.contains({key: formatted_value})


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, session: AsyncSession) -> None:
        super().__init__(Notification, session)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        types: Sequence[NotificationType] | None = None,
        is_read: bool | None = None,
        page: int = 1,
        limit: int = 10,
    ) -> tuple[Sequence[Notification], int, int]:
        filters = [Notification.user_id == user_id]
        if types is not None:
            filters.append(Notification.notification_type.in_(types))
        if is_read is not None:
            filters.append(Notification.is_read.is_(is_read))

        count_result = await self.session.execute(
            select(func.count()).select_from(Notification).where(*filters)
        )
        total = count_result.scalar_one()
        total_pages = ceil(total / limit) if total > 0 else 1

        result = await self.session.execute(
            select(Notification)
            .where(*filters)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        return result.scalars().all(), total, total_pages

    async def count_by_type(
        self, user_id: uuid.UUID
    ) -> list[tuple[NotificationType, int, int]]:
        result = await self.session.execute(
            select(
                Notification.notification_type,
                func.count(),
                func.count().filter(Notification.is_read.is_(False)),
            )
            .where(Notification.user_id == user_id)
            .group_by(Notification.notification_type)
        )
        return [(row[0], row[1], row[2]) for row in result.all()]

    async def get_for_user(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification | None:
        result = await self.session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def create_notification(
        self,
        *,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        message: str,
        metadata_payload: dict[str, Any] | None = None,
    ) -> Notification:
        return await self.create(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            metadata_payload=metadata_payload,
        )

    async def create_many(
        self, notifications: Sequence[dict[str, Any]]
    ) -> Sequence[Notification]:
        notification_instances = [Notification(**data) for data in notifications]
        self.session.add_all(notification_instances)
        await self.session.flush()
        return notification_instances

    async def set_read_status(
        self, notification: Notification, *, is_read: bool
    ) -> Notification:
        if notification.is_read == is_read:
            return notification
        return await self.update(
            notification,
            exclude_none=False,
            is_read=is_read,
            read_at=datetime.now(UTC) if is_read else None,
        )

    async def mark_read(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification | None:
        notification = await self.get_for_user(notification_id, user_id)
        if notification is None:
            return None
        return await self.set_read_status(notification, is_read=True)

    async def mark_unread(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> Notification | None:
        notification = await self.get_for_user(notification_id, user_id)
        if notification is None:
            return None
        return await self.set_read_status(notification, is_read=False)

    async def mark_many_read(
        self, notification_ids: Sequence[uuid.UUID], user_id: uuid.UUID
    ) -> int:
        if not notification_ids:
            return 0
        result = await self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.id.in_(notification_ids),
                Notification.is_read.is_(False),
            )
            .values(is_read=True, read_at=func.now())
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return len(result.all())

    async def mark_all_read(self, user_id: uuid.UUID) -> int:
        result = await self.session.execute(
            update(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
            .values(is_read=True, read_at=func.now())
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return len(result.all())

    async def count_unread(self, user_id: uuid.UUID) -> int:
        result = await self.session.execute(
            select(func.count())
            .select_from(Notification)
            .where(Notification.user_id == user_id, Notification.is_read.is_(False))
        )
        return result.scalar_one()

    async def delete_for_user(
        self, notification_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        result = await self.session.execute(
            delete(Notification)
            .where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return result.first() is not None

    async def delete_all_for_user(
        self, user_id: uuid.UUID, *, only_read: bool = False
    ) -> int:
        filters = [Notification.user_id == user_id]
        if only_read:
            filters.append(Notification.is_read.is_(True))
        result = await self.session.execute(
            delete(Notification)
            .where(*filters)
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return len(result.all())

    async def delete_older_than(self, cutoff: datetime) -> int:
        result = await self.session.execute(
            delete(Notification)
            .where(Notification.created_at < cutoff)
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return len(result.all())

    async def delete_expired(
        self, retention: timedelta = NOTIFICATION_RETENTION
    ) -> int:
        """Delete notifications (read or not) older than the retention period."""
        return await self.delete_older_than(datetime.now(UTC) - retention)

    async def list_by_metadata(
        self,
        user_id: uuid.UUID,
        key: str,
        value: str | int | bool | uuid.UUID,
        *,
        is_read: bool | None = None,
    ) -> Sequence[Notification]:
        filters = [
            Notification.user_id == user_id,
            _metadata_payload_filter(key, value),
        ]
        if is_read is not None:
            filters.append(Notification.is_read.is_(is_read))
        result = await self.session.execute(
            select(Notification)
            .where(*filters)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
        )
        return result.scalars().all()

    async def mark_read_by_metadata(
        self,
        user_id: uuid.UUID,
        key: str,
        value: str | int | bool | uuid.UUID,
    ) -> int:
        result = await self.session.execute(
            update(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
                _metadata_payload_filter(key, value),
            )
            .values(is_read=True, read_at=func.now())
            .returning(Notification.id)
            .execution_options(synchronize_session=False)
        )
        return len(result.all())
