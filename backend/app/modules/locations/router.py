from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query

from app.modules.locations.dependencies import get_location_service
from app.modules.locations.schemas import (
    CityRead,
    CountryRead,
    CountryWithCitiesRead,
)
from app.modules.locations.service import LocationService

router = APIRouter(prefix="/locations", tags=["locations"])


@router.get(
    "/countries", response_model=list[CountryRead], summary="List supported countries"
)
async def list_countries(
    service: Annotated[LocationService, Depends(get_location_service)],
) -> list[CountryRead]:
    return await service.list_countries()


@router.get(
    "/grouped",
    response_model=list[CountryWithCitiesRead],
    summary="List countries with their active cities for grouped selection",
)
async def list_countries_with_cities(
    service: Annotated[LocationService, Depends(get_location_service)],
    accept_language: Annotated[str | None, Header()] = None,
) -> list[CountryWithCitiesRead]:
    return await service.list_countries_with_cities(accept_language)


@router.get(
    "/cities",
    response_model=list[CityRead],
    summary="Search cities with coordinates for event search by distance",
)
async def search_cities(
    service: Annotated[LocationService, Depends(get_location_service)],
    accept_language: Annotated[str | None, Header()] = None,
    query: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    q: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    country_code: Annotated[str | None, Query(min_length=2, max_length=2)] = None,
    limit: Annotated[int, Query(ge=1, le=500)] = 50,
) -> list[CityRead]:
    return await service.search_cities(
        query=q or query,
        country_code=country_code,
        limit=limit,
        accept_language=accept_language,
    )
