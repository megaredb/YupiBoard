import uuid
from datetime import datetime
from typing import Annotated

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator

from app.modules.event_applications.models import ApplicationStatus
from app.modules.events.models import EventStatus

Latitude = Annotated[float, Field(ge=-90, le=90)]
LongitudeValue = Annotated[float, Field(ge=-180, le=180)]


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    game_title: str = Field(min_length=1, max_length=255)
    address: str = Field(min_length=1, max_length=512)
    lat: Latitude
    lon: LongitudeValue
    city: str = Field(min_length=1, max_length=255)
    start_datetime: datetime
    end_datetime: datetime | None = None
    min_players: int = Field(ge=1)
    max_players: int = Field(ge=1)
    entry_cost: float = Field(ge=0)
    photo_url: AnyHttpUrl | None = None

    @model_validator(mode="after")
    def validate_event_limits(self) -> EventCreate:
        if self.min_players > self.max_players:
            raise ValueError("min_players cannot exceed max_players")
        if self.end_datetime and self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be later than start_datetime")
        return self


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, min_length=1)
    game_title: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = Field(default=None, min_length=1, max_length=512)
    lat: Latitude | None = None
    lon: LongitudeValue | None = None
    city: str | None = Field(default=None, min_length=1, max_length=255)
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    min_players: int | None = Field(default=None, ge=1)
    max_players: int | None = Field(default=None, ge=1)
    entry_cost: float | None = Field(default=None, ge=0)
    photo_url: AnyHttpUrl | None = None

    @model_validator(mode="after")
    def reject_null_required_fields(self) -> EventUpdate:
        nullable_fields = {"end_datetime", "photo_url"}
        for field_name in self.model_fields_set - nullable_fields:
            if getattr(self, field_name) is None:
                raise ValueError(f"{field_name} cannot be null")
        return self


class EventHostRead(BaseModel):
    id: uuid.UUID
    full_name: str | None
    avatar_url: str | None
    rating_average: float
    rating_count: int


class EventRead(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    title: str
    description: str
    game_title: str
    address: str
    lat: float
    lon: float
    city: str
    start_datetime: datetime
    end_datetime: datetime | None
    min_players: int
    max_players: int
    entry_cost: float
    photo_url: str | None
    status: EventStatus
    rejection_reason: str | None
    is_verified: bool
    promoted_to_datetime: datetime | None
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    host: EventHostRead
    free_seats: int

    model_config = ConfigDict(from_attributes=True)


class EventPage(BaseModel):
    items: list[EventRead]
    total: int
    page: int
    page_size: int


class EventCreateResponse(BaseModel):
    message: str
    event: EventRead


class EventApplicationRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class EventModerationUpdate(BaseModel):
    status: EventStatus
    rejection_reason: str | None = Field(default=None, max_length=2000)
    promoted_to_datetime: datetime | None = None


class EventRatingCreate(BaseModel):
    score: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class EventRatingRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    organizer_id: uuid.UUID
    reviewer_id: uuid.UUID
    score: int
    comment: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
