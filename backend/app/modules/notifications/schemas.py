import uuid
from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field

from app.modules.notifications.enums import (
    NOTIFICATION_CATEGORY,
    NotificationCategory,
    NotificationType,
)


class NotificationCreate(BaseModel):
    user_id: uuid.UUID
    notification_type: NotificationType
    title: str = Field(min_length=1, max_length=150)
    message: str = Field(min_length=1)
    metadata_payload: dict[str, Any] | None = None


class NotificationRead(BaseModel):
    id: uuid.UUID
    notification_type: NotificationType
    title: str
    message: str
    is_read: bool
    metadata_payload: dict[str, Any] | None = Field(
        default=None,
        validation_alias=AliasChoices("metadata_payload", "metadata"),
        description="Routing parameters for in-app navigation (e.g. booking_id)",
    )
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @computed_field
    @property
    def category(self) -> NotificationCategory:
        return NOTIFICATION_CATEGORY[self.notification_type]


class NotificationFilterParams(BaseModel):
    category: NotificationCategory | None = Field(
        default=None, description="Tab filter; omit for all notifications"
    )
    is_read: bool | None = None
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=10, ge=1, le=100)

    model_config = ConfigDict(extra="forbid")


class NotificationPage(BaseModel):
    items: list[NotificationRead]
    total: int
    page: int
    total_pages: int


class CategoryCount(BaseModel):
    total: int
    unread: int


class NotificationCountsRead(BaseModel):
    total: int
    unread: int
    by_category: dict[NotificationCategory, CategoryCount]


class MarkAllReadResponse(BaseModel):
    updated: int


class UnreadCountResponse(BaseModel):
    unread: int


class DeletedCountResponse(BaseModel):
    deleted: int


class NotificationIdsRequest(BaseModel):
    ids: list[uuid.UUID] = Field(min_length=1, max_length=100)

    model_config = ConfigDict(extra="forbid")


class NotificationMetadataFilter(BaseModel):
    key: str = Field(min_length=1, max_length=100, examples=["booking_id"])
    value: str | int | bool = Field(examples=["0198f1a2-..."])

    model_config = ConfigDict(extra="forbid")
