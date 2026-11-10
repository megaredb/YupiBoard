import pytest
from httpx import AsyncClient


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
