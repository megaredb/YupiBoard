import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.events.schemas import EventRead


class EventRejectRequest(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)

    @field_validator("reason", mode="before")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        if isinstance(value, str):
            stripped = value.strip()
            if len(stripped) < 3:
                raise ValueError("Rejection reason must be at least 3 characters")
            return stripped
        return value


class ModerationSortBy(StrEnum):
    CREATED = "created_at"
    DATE = "start_datetime"
    COST = "cost"
    DISTANCE = "distance"


class ModerationEventRead(EventRead):
    """A queue entry: the event plus who decided on it and when."""

    moderated_at: datetime | None = None
    moderator_name: str | None = None


class ModerationQueuePage(BaseModel):
    items: list[ModerationEventRead]
    total: int
    page: int
    total_pages: int


class AdminAuditLogRead(BaseModel):
    id: uuid.UUID
    admin_id: uuid.UUID | None = None
    action_type: str
    target_entity: str
    target_id: uuid.UUID
    justification_reason: str | None = None
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminAuditLogPage(BaseModel):
    items: list[AdminAuditLogRead]
    total: int
    page: int
    total_pages: int
