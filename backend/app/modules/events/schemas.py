import uuid
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum
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


OrganizerRating = Annotated[Decimal, Field(ge=Decimal(1), le=Decimal(5))]


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


class EventSortBy(StrEnum):
    TITLE = "title"
    DATE = "start_datetime"
    DISTANCE = "distance"
    COST = "cost"


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class EventFilterParams(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    organizer_id: uuid.UUID | None = None
    organizer_name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
        description="Search by organizer first or last name",
    )
    organizer_rating_min: OrganizerRating | None = None
    organizer_rating_max: OrganizerRating | None = None
    city: str | None = Field(default=None, max_length=100)
    lat: Latitude | None = None
    lon: Longitude | None = None
    radius_km: float | None = Field(
        default=None,
        gt=0,
        description="Filter events within radius in kilometers",
    )
    date_from: datetime | None = None
    date_to: datetime | None = None
    cost_min: Decimal | None = Field(default=None, ge=Decimal("0.00"))
    cost_max: Decimal | None = Field(default=None, ge=Decimal("0.00"))
    available_seats_min: int | None = Field(
        default=None,
        ge=1,
        le=20,
        description="Only events with at least this many free seats",
    )
    sort_by: EventSortBy | None = None
    sort_order: SortOrder = SortOrder.ASC
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    @model_validator(mode="after")
    def validate_filters(self) -> EventFilterParams:
        has_location = self.lat is not None and self.lon is not None
        if (self.lat is None) != (self.lon is None):
            raise ValueError("lat and lon must be provided together")
        if self.radius_km is not None and not has_location:
            raise ValueError("lat and lon must be provided when radius_km is specified")
        if self.sort_by == EventSortBy.DISTANCE and not has_location:
            raise ValueError("lat and lon must be provided to sort by distance")
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from cannot be later than date_to")
        if (
            self.cost_min is not None
            and self.cost_max is not None
            and self.cost_min > self.cost_max
        ):
            raise ValueError("cost_min cannot exceed cost_max")
        if (
            self.organizer_rating_min is not None
            and self.organizer_rating_max is not None
            and self.organizer_rating_min > self.organizer_rating_max
        ):
            raise ValueError("organizer_rating_min cannot exceed organizer_rating_max")
        return self


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


class EventImageUploadResponse(BaseModel):
    image_url: str
