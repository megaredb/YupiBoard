from app.modules.locations.repository import CityRepository, CountryRepository
from app.modules.locations.schemas import CityRead, CountryRead


class LocationService:
    def __init__(
        self,
        city_repo: CityRepository,
        country_repo: CountryRepository,
    ) -> None:
        self.city_repo = city_repo
        self.country_repo = country_repo

    async def list_countries(self) -> list[CountryRead]:
        countries = await self.country_repo.list_all()
        return [CountryRead.model_validate(c) for c in countries]

    async def search_cities(
        self,
        query: str | None = None,
        country_code: str | None = None,
        limit: int = 20,
    ) -> list[CityRead]:
        cities = await self.city_repo.search(
            query=query, country_code=country_code, limit=limit
        )
        return [
            CityRead(
                id=city.id,
                name=city.name,
                country_code=city.country.code,
                lat=city.lat,
                lon=city.lon,
            )
            for city in cities
        ]
