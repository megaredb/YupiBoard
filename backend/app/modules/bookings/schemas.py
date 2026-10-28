import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.modules.bookings.models import BookingStatus


class BookingCreateResponse(BaseModel):
    booking_id: uuid.UUID
    event_id: uuid.UUID
    status: BookingStatus
    message: str


class BookingRead(BaseModel):
    id: uuid.UUID
    event_id: uuid.UUID
    user_id: uuid.UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
