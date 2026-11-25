import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient
from sqlalchemy.dialects import postgresql

from app.main import app
from app.modules.locations.dependencies import get_location_service
from app.modules.locations.repository import CityRepository
from app.modules.locations.schemas import CityRead
from app.modules.locations.service import LocationService


@pytest.mark.asyncio
async def test_city_search_matches_english_and_ukrainian_names() -> None:
    session = AsyncMock()
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    session.execute.return_value = result
    repository = CityRepository(session)

    await repository.search(query="Київ")

    statement = session.execute.await_args.args[0]
    sql = str(statement.compile(dialect=postgresql.dialect()))
    assert "cities.name ILIKE" in sql
    assert "city_translations.name ILIKE" in sql


@pytest.mark.asyncio
async def test_city_search_localizes_name_using_accept_language() -> None:
    city = SimpleNamespace(
        id=uuid.uuid7(),
        name="Kyiv",
        translations=[SimpleNamespace(language_code="uk", name="Київ")],
        lat=50.4501,
        lon=30.5234,
        country=SimpleNamespace(code="UA"),
    )
    city_repo = AsyncMock()
    city_repo.search.return_value = [city]
    geocoding = AsyncMock()
    geocoding.search_cities.return_value = []
    service = LocationService(city_repo, AsyncMock(), geocoding_service=geocoding)

    ukrainian = await service.search_cities(
        query="Kyiv", country_code="UA", accept_language="en;q=0.8,uk-UA;q=0.9"
    )
    english = await service.search_cities(
        query="Київ", country_code="UA", accept_language="en;q=0.9,uk;q=0.8"
    )

    assert ukrainian[0].name == "Київ"
    assert english[0].name == "Kyiv"
    city_repo.search.assert_awaited_with(query="Київ", country_code="UA", limit=20)
    geocoding.search_cities.assert_not_awaited()


@pytest.mark.asyncio
async def test_grouped_cities_localize_names_using_accept_language() -> None:
    city = SimpleNamespace(
        id=uuid.uuid7(),
        name="Kyiv",
        translations=[SimpleNamespace(language_code="uk", name="Київ")],
        lat=50.4501,
        lon=30.5234,
        is_active=True,
    )
    country = SimpleNamespace(
        id=uuid.uuid7(),
        code="UA",
        name="Ukraine",
        cities=[city],
    )
    country_repo = AsyncMock()
    country_repo.list_with_cities.return_value = [country]
    service = LocationService(AsyncMock(), country_repo)

    grouped = await service.list_countries_with_cities("uk")

    assert grouped[0].cities[0].name == "Київ"


@pytest.mark.asyncio
async def test_city_search_route_accepts_q_and_accept_language(
    async_client: AsyncClient,
) -> None:
    service = AsyncMock()
    service.search_cities.return_value = [
        CityRead(
            id=uuid.uuid7(),
            name="Київ",
            canonical_name="Kyiv",
            country_code="UA",
            lat=50.4501,
            lon=30.5234,
        )
    ]
    previous_override = app.dependency_overrides.get(get_location_service)
    app.dependency_overrides[get_location_service] = lambda: service
    try:
        response = await async_client.get(
            "/api/v1/locations/cities?q=Kyiv",
            headers={"Accept-Language": "uk"},
        )
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_location_service, None)
        else:
            app.dependency_overrides[get_location_service] = previous_override

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Київ"
    service.search_cities.assert_awaited_once_with(
        query="Kyiv",
        country_code=None,
        limit=50,
        accept_language="uk",
    )


@pytest.mark.asyncio
async def test_locations_countries_and_cities_endpoints(
    async_client: AsyncClient,
) -> None:
    # Test countries list
    res_countries = await async_client.get("/api/v1/locations/countries")
    assert res_countries.status_code == 200
    countries = res_countries.json()
    assert len(countries) >= 3
    country_codes = {c["code"] for c in countries}
    assert "UA" in country_codes
    assert "PL" in country_codes
    assert "DE" in country_codes

    # Test cities list
    res_cities = await async_client.get("/api/v1/locations/cities")
    assert res_cities.status_code == 200
    cities = res_cities.json()
    assert len(cities) >= 5

    # Test search autocomplete
    res_kyiv = await async_client.get("/api/v1/locations/cities?q=kyiv")
    assert res_kyiv.status_code == 200
    kyiv_list = res_kyiv.json()
    assert any(c["name"] == "Kyiv" and c["country_code"] == "UA" for c in kyiv_list)

    res_kyiv_uk = await async_client.get(
        "/api/v1/locations/cities?q=Київ",
        headers={"Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8"},
    )
    assert res_kyiv_uk.status_code == 200
    assert any(
        c["name"] == "Київ" and c["country_code"] == "UA" for c in res_kyiv_uk.json()
    )

    res_kyiv_en_query_uk = await async_client.get(
        "/api/v1/locations/cities?query=Kyiv",
        headers={"Accept-Language": "uk"},
    )
    assert any(
        c["name"] == "Київ" and c["country_code"] == "UA"
        for c in res_kyiv_en_query_uk.json()
    )

    # Test filter by country_code
    res_pl = await async_client.get("/api/v1/locations/cities?country_code=PL")
    assert res_pl.status_code == 200
    pl_cities = res_pl.json()
    assert all(c["country_code"] == "PL" for c in pl_cities)
    assert any(c["name"] == "Warsaw" for c in pl_cities)

    # Test grouped countries and cities
    res_grouped = await async_client.get("/api/v1/locations/grouped")
    assert res_grouped.status_code == 200
    grouped = res_grouped.json()
    assert len(grouped) >= 3
    ua_group = next(g for g in grouped if g["code"] == "UA")
    assert len(ua_group["cities"]) >= 3
    assert any(c["name"] == "Kyiv" for c in ua_group["cities"])

    res_grouped_uk = await async_client.get(
        "/api/v1/locations/grouped", headers={"Accept-Language": "uk"}
    )
    ua_group_uk = next(g for g in res_grouped_uk.json() if g["code"] == "UA")
    assert any(c["name"] == "Київ" for c in ua_group_uk["cities"])


@pytest.mark.asyncio
async def test_city_search_appends_deduped_photon_results() -> None:
    db_city = SimpleNamespace(
        id=uuid.uuid7(),
        name="Kyiv",
        translations=[SimpleNamespace(language_code="uk", name="Київ")],
        lat=50.4501,
        lon=30.5234,
        country=SimpleNamespace(code="UA"),
    )
    city_repo = AsyncMock()
    city_repo.search.return_value = [db_city]
    geocoding = AsyncMock()
    geocoding.search_cities.return_value = [
        CityRead(
            id=uuid.uuid7(),
            name="Kyiv",
            canonical_name="Kyiv",
            country_code="UA",
            lat=50.4501,
            lon=30.5234,
        ),
        CityRead(
            id=uuid.uuid7(),
            name="Prague",
            canonical_name="Prague",
            country_code="CZ",
            lat=50.0755,
            lon=14.4378,
        ),
    ]
    service = LocationService(city_repo, AsyncMock(), geocoding_service=geocoding)

    results = await service.search_cities(query="Pra", limit=10, accept_language="uk")

    assert [c.canonical_name for c in results] == ["Kyiv", "Prague"]
    assert results[0].name == "Київ"
    assert results[1].name == "Prague"
    assert results[1].country_code == "CZ"
    geocoding.search_cities.assert_awaited_once_with(
        "Pra", country_code=None, limit=9
    )
