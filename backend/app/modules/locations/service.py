from app.core.exceptions import NotFoundException
from app.modules.locations.geocoding import GeocodingService
from app.modules.locations.models import City
from app.modules.locations.repository import CityRepository, CountryRepository
from app.modules.locations.schemas import (
    CityRead,
    CountryRead,
    CountryWithCitiesRead,
    GeocodeResult,
    ReverseGeocodeResult,
)


def _preferred_languages(accept_language: str | None) -> list[str]:
    if not accept_language:
        return []

    preferences: list[tuple[float, int, str]] = []
    for order, entry in enumerate(accept_language.split(",")):
        parts = entry.strip().lower().split(";")
        language_tag = parts[0].strip()
        subtags = language_tag.split("-")
        primary_language = subtags[0]
        if (
            not 2 <= len(primary_language) <= 3
            or not primary_language.isalpha()
            or any(not subtag.isalnum() for subtag in subtags)
        ):
            continue

        quality = 1.0
        for parameter in parts[1:]:
            key, separator, value = parameter.strip().partition("=")
            if key.strip() == "q" and separator:
                try:
                    quality = float(value)
                except ValueError:
                    quality = 0.0
                break

        if 0.0 < quality <= 1.0:
            preferences.append((-quality, order, language_tag))

    languages: list[str] = []
    for _, _, language_tag in sorted(preferences):
        language = language_tag
        while language:
            if language not in languages:
                languages.append(language)
            if "-" not in language:
                break
            language = language.rsplit("-", maxsplit=1)[0]
    return languages


def _localized_city_name(city: City, languages: list[str]) -> str:
    city_name = city.name
    translations = {
        translation.language_code.lower(): translation.name
        for translation in city.translations
    }
    for language in languages:
        if language == "en" or language.startswith("en-"):
            return city_name
        if language in translations:
            return translations[language]
    return city_name


class LocationService:
    def __init__(
        self,
        city_repo: CityRepository,
        country_repo: CountryRepository,
        geocoding_service: GeocodingService | None = None,
    ) -> None:
        self.city_repo = city_repo
        self.country_repo = country_repo
        self.geocoding_service = geocoding_service or GeocodingService()

    async def list_countries(self) -> list[CountryRead]:
        countries = await self.country_repo.list_all()
        return [CountryRead.model_validate(c) for c in countries]

    async def list_countries_with_cities(
        self, accept_language: str | None = None
    ) -> list[CountryWithCitiesRead]:
        languages = _preferred_languages(accept_language)
        countries = await self.country_repo.list_with_cities()
        return [
            CountryWithCitiesRead(
                id=c.id,
                code=c.code,
                name=c.name,
                cities=[
                    CityRead(
                        id=city.id,
                        name=_localized_city_name(city, languages),
                        country_code=c.code,
                        lat=city.lat,
                        lon=city.lon,
                    )
                    for city in c.cities
                    if city.is_active
                ],
            )
            for c in countries
        ]

    async def search_cities(
        self,
        query: str | None = None,
        country_code: str | None = None,
        limit: int = 20,
        accept_language: str | None = None,
    ) -> list[CityRead]:
        languages = _preferred_languages(accept_language)
        cities = await self.city_repo.search(
            query=query, country_code=country_code, limit=limit
        )
        return [
            CityRead(
                id=city.id,
                name=_localized_city_name(city, languages),
                country_code=city.country.code,
                lat=city.lat,
                lon=city.lon,
            )
            for city in cities
        ]

    async def geocode(
        self, query: str, *, city: str | None = None, limit: int = 5
    ) -> list[GeocodeResult]:
        return await self.geocoding_service.geocode(query, city=city, limit=limit)

    async def reverse_geocode(self, lat: float, lon: float) -> ReverseGeocodeResult:
        result = await self.geocoding_service.reverse_geocode(lat, lon)
        if result is None:
            raise NotFoundException("Address could not be resolved for coordinates")
        return result