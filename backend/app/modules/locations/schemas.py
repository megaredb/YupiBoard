import uuid

from pydantic import BaseModel, ConfigDict


class CountryRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class CityRead(BaseModel):
    id: uuid.UUID
    # Localized by `Accept-Language`; for display only.
    name: str
    # The English name that events and profiles store; stable across languages.
    canonical_name: str
    country_code: str
    lat: float
    lon: float

    model_config = ConfigDict(from_attributes=True)


class CountryWithCitiesRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    cities: list[CityRead]

    model_config = ConfigDict(from_attributes=True)


class GeocodeResult(BaseModel):
    display_name: str
    address: str
    city: str | None = None
    country_code: str | None = None
    lat: float
    lon: float


class ReverseGeocodeResult(BaseModel):
    display_name: str
    address: str
    city: str | None = None
    country_code: str | None = None
    lat: float
    lon: float
