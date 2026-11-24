from typing import Annotated

from fastapi import APIRouter, Depends, Header, Query

from app.modules.locations.dependencies import get_location_service
from app.modules.locations.schemas import (
    CityRead,
    CountryRead,
    CountryWithCitiesRead,
    GeocodeResult,
    ReverseGeocodeResult,
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


@router.get(
    "/geocode",
    response_model=list[GeocodeResult],
    summary="Forward geocode a street address or venue name into coordinates",
    responses={503: {"description": "The geocoding provider is unavailable"}},
)
async def geocode_address(
    service: Annotated[LocationService, Depends(get_location_service)],
    query: Annotated[str, Query(min_length=2, max_length=255)],
    city: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
) -> list[GeocodeResult]:
    return await service.geocode(query=query, city=city, limit=limit)


@router.get(
    "/suggest",
    response_model=list[GeocodeResult],
    summary="Address suggestions while typing, limited to the area of `city`",
    responses={503: {"description": "The suggestion provider is unavailable"}},
)
async def suggest_addresses(
    service: Annotated[LocationService, Depends(get_location_service)],
    query: Annotated[str, Query(min_length=3, max_length=255)],
    city: Annotated[str | None, Query(min_length=1, max_length=100)] = None,
    limit: Annotated[int, Query(ge=1, le=10)] = 5,
) -> list[GeocodeResult]:
    return await service.suggest_addresses(query=query, city=city, limit=limit)


@router.get(
    "/reverse",
    response_model=ReverseGeocodeResult,
    summary="Reverse geocode coordinates into a street address",
)
async def reverse_geocode(
    service: Annotated[LocationService, Depends(get_location_service)],
    lat: Annotated[float, Query(ge=-90, le=90)],
    lon: Annotated[float, Query(ge=-180, le=180)],
) -> ReverseGeocodeResult:
    return await service.reverse_geocode(lat=lat, lon=lon)
