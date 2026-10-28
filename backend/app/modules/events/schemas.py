import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, model_validator

from app.modules.events.models import EventStatus

Latitude = Annotated[float, Field(ge=-90, le=90)]
Longitude = Annotated[float, Field(ge=-180, le=180)]


class EventCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=1, max_length=2000)
    game_title: str = Field(min_length=1, max_length=150)
    address: str = Field(min_length=1, max_length=255)
    city: str = Field(min_length=1, max_length=100)
    lat: Latitude
    lon: Longitude
    start_datetime: datetime
    end_datetime: datetime | None = None
    min_players: int = Field(default=1, ge=1, le=20)
    max_players: int = Field(ge=1, le=20)
    entry_cost: Decimal = Field(default=Decimal("0.00"), ge=Decimal("0.00"))
    photo_url: AnyHttpUrl | None = None

    @model_validator(mode="after")
    def validate_event_data(self) -> EventCreate:
        now = datetime.now(UTC)
        if self.start_datetime <= now:
            raise ValueError("start_datetime must be in the future")
        if self.min_players > self.max_players:
            raise ValueError("min_players cannot exceed max_players")
        if self.end_datetime and self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be later than start_datetime")
        return self


class EventCreateResponse(BaseModel):
    event_id: uuid.UUID
    status: EventStatus
    is_verified: bool
    message: str


class EventOrganizerSummary(BaseModel):
    id: uuid.UUID
    name: str
    rating_as_organizer: Decimal | None = None

    model_config = ConfigDict(from_attributes=True)


class EventListItem(BaseModel):
    id: uuid.UUID
    title: str
    game_title: str
    city: str
    address: str
    start_datetime: datetime
    entry_cost: Decimal
    max_players: int
    current_confirmed: int
    available_seats: int
    distance_km: float | None = None
    is_promoted: bool
    organizer: EventOrganizerSummary

    model_config = ConfigDict(from_attributes=True)


class EventPage(BaseModel):
    items: list[EventListItem]
    total: int
    page: int
    total_pages: int


class EventRead(BaseModel):
    id: uuid.UUID
    organizer_id: uuid.UUID
    title: str
    description: str
    game_title: str
    address: str
    city: str
    lat: Latitude
    lon: Longitude
    start_datetime: datetime
    end_datetime: datetime | None
    min_players: int
    max_players: int
    current_confirmed: int
    available_seats: int
    entry_cost: Decimal
    photo_url: str | None
    status: EventStatus
    is_verified: bool
    is_promoted: bool
    organizer: EventOrganizerSummary
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
