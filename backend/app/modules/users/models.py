from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Numeric, String, Text, false
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.auth.models import RefreshToken


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    __table_args__ = (
        CheckConstraint(
            "rating_as_player BETWEEN 1 AND 5", name="ck_users_rating_as_player"
        ),
        CheckConstraint(
            "rating_as_organizer BETWEEN 1 AND 5", name="ck_users_rating_as_organizer"
        ),
    )

    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, server_default=false(), nullable=False)
    google_sub: Mapped[str | None] = mapped_column(
        String(255), unique=True, index=True, nullable=True
    )
    avatar_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating_as_player: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )
    rating_as_organizer: Mapped[Decimal | None] = mapped_column(
        Numeric(3, 2), nullable=True
    )

    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
    )
