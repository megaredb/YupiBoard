from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.types import UUID7
from app.modules.users.enums import UserStatus


class UserBase(BaseModel):
    email: EmailStr
    first_name: str | None = Field(default=None, max_length=50)
    last_name: str | None = Field(default=None, max_length=50)


class UserUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=2, max_length=50)
    last_name: str | None = Field(default=None, min_length=2, max_length=50)
    avatar_url: str | None = Field(default=None, max_length=1024)
    city: str | None = Field(default=None, max_length=100)
    contact_info: str | None = Field(default=None, max_length=500)

    @field_validator("first_name", "last_name", mode="before")
    @classmethod
    def disallow_explicit_null_names(cls, v: Any) -> Any:
        if v is None:
            raise ValueError("Name field cannot be null")
        return v


class PasswordChangeRequest(BaseModel):
    new_password: str = Field(min_length=8, max_length=128)


class UserRead(UserBase):
    id: UUID7
    avatar_url: str | None = None
    created_at: datetime
    updated_at: datetime
    city: str | None = None
    contact_info: str | None = None
    rating_as_player: Decimal | None = None
    rating_as_organizer: Decimal | None = None
    status: UserStatus = UserStatus.ACTIVE
    is_verified: bool
    is_superuser: bool

    model_config = ConfigDict(from_attributes=True)
