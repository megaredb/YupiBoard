import uuid

from pydantic import BaseModel, ConfigDict


class CountryRead(BaseModel):
    id: uuid.UUID
    code: str
    name: str

    model_config = ConfigDict(from_attributes=True)


class CityRead(BaseModel):
    id: uuid.UUID
    name: str
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
