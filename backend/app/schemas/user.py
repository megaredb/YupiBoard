import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=255)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, max_length=255)
    avatar_url: str | None = Field(default=None, max_length=1024)
    city: str | None = Field(default=None, max_length=100)
    contact_info: str | None = Field(default=None, max_length=500)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: uuid.UUID
    is_active: bool
    is_verified: bool
    is_superuser: bool
    avatar_url: str | None = None
    city: str | None = None
    contact_info: str | None = None
    rating_as_player: float
    rating_as_organizer: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
