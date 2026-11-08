import uuid

from pydantic import BaseModel, ConfigDict


class CountryRead(BaseModel):
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
