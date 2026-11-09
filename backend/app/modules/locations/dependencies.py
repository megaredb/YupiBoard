from typing import Annotated

from fastapi import Depends

from app.core.database import SessionDep
from app.modules.locations.repository import CityRepository, CountryRepository
from app.modules.locations.service import LocationService


def get_country_repository(session: SessionDep) -> CountryRepository:
    return CountryRepository(session)


def get_city_repository(session: SessionDep) -> CityRepository:
    return CityRepository(session)


def get_location_service(
    city_repo: Annotated[CityRepository, Depends(get_city_repository)],
    country_repo: Annotated[CountryRepository, Depends(get_country_repository)],
) -> LocationService:
    return LocationService(city_repo=city_repo, country_repo=country_repo)
