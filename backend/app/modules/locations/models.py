import uuid

from sqlalchemy import Boolean, Float, ForeignKey, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin


class Country(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "countries"

    code: Mapped[str] = mapped_column(
        String(2), unique=True, index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    cities: Mapped[list[City]] = relationship(
        "City", back_populates="country", cascade="all, delete-orphan"
    )


class City(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "cities"

    country_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("countries.id", ondelete="CASCADE"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lon: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, default=True, server_default=text("true"), nullable=False
    )

    country: Mapped[Country] = relationship("Country", back_populates="cities")
