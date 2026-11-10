import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.modules.bookings.models import BookingStatus


class BookingCreateResponse(BaseModel):
    booking_id: uuid.UUID
    event_id: uuid.UUID
    status: BookingStatus
    message: str


class BookingParticipantSummary(BaseModel):
    id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    avatar_url: str | None = None
    rating_as_player: Decimal | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class BookingEventSummary(BaseModel):
    id: uuid.UUID
    title: str
    game_title: str
    location_name: str | None = None
    city: str
    address: str
    start_datetime: datetime
    entry_cost: Decimal
    photo_url: str | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class BookingRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    event: BookingEventSummary | None = None
    user: BookingParticipantSummary | None = None

    model_config = ConfigDict(from_attributes=True)


class BookingPage(BaseModel):
    items: list[BookingRead]
    total: int
    page: int
    total_pages: int
