from __future__ import annotations

import uuid
from enum import StrEnum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.events.models import Event
    from app.modules.users.models import User


class ApplicationStatus(StrEnum):
    PENDING = "Pending"
    ACCEPTED = "Accepted"
    REJECTED = "Rejected"
    CANCELLED = "Cancelled"


class EventApplication(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "event_applications"
    __table_args__ = (
        UniqueConstraint(
            "event_id", "user_id", name="uq_event_applications_event_user"
        ),
    )

    event_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("events.id", ondelete="CASCADE"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(
            ApplicationStatus,
            name="event_application_status",
            native_enum=False,
            values_callable=lambda enum: [item.value for item in enum],
        ),
        default=ApplicationStatus.PENDING,
        nullable=False,
    )

    event: Mapped[Event] = relationship(back_populates="applications")
    user: Mapped[User] = relationship("User")
