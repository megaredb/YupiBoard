from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from httpx import AsyncClient

from app.modules.locations.geocoding import GeocodingService
from app.modules.locations.schemas import GeocodeResult, ReverseGeocodeResult


@pytest.mark.asyncio
async def test_locations_geocode_and_reverse_endpoints(
    async_client: AsyncClient,
) -> None:
    fwd_mock = AsyncMock(
        return_value=[
            GeocodeResult(
                display_name="Khreshchatyk St, 24, Kyiv, Ukraine",
                address="Khreshchatyk St 24",
                city="Kyiv",
                country_code="UA",
                lat=50.4472,
                lon=30.5228,
            )
        ]
    )
    rev_mock = AsyncMock(
        return_value=ReverseGeocodeResult(
            display_name="Khreshchatyk St, 24, Kyiv, Ukraine",
            address="Khreshchatyk St 24",
            city="Kyiv",
            country_code="UA",
            lat=50.4472,
            lon=30.5228,
        )
    )
    with (
        patch.object(GeocodingService, "geocode", fwd_mock),
        patch.object(GeocodingService, "reverse_geocode", rev_mock),
    ):
        fwd_res = await async_client.get(
            "/api/v1/locations/geocode",
            params={"query": "Khreshchatyk 24", "city": "Kyiv"},
        )
        assert fwd_res.status_code == 200
        assert fwd_res.json()[0]["lat"] == pytest.approx(50.4472)

        rev_res = await async_client.get(
            "/api/v1/locations/reverse",
            params={"lat": 50.4472, "lon": 30.5228},
        )
        assert rev_res.status_code == 200
        assert rev_res.json()["city"] == "Kyiv"


@pytest.mark.asyncio
async def test_create_event_accepts_explicit_coordinates_and_geocodes_when_omitted(
    async_client: AsyncClient, create_mock_user
) -> None:
    _, token = await create_mock_user(is_verified=True)
    headers = {"Authorization": f"Bearer {token}"}
    start_dt = (datetime.now(UTC) + timedelta(days=2)).isoformat()

    # 1. Explicit venue coordinates are stored verbatim (not replaced by city center)
    explicit_res = await async_client.post(
        "/api/v1/events",
        headers=headers,
        json={
            "title": "Explicit Coords Event",
            "description": "Venue has exact coordinates.",
            "game_title": "Root",
            "address": "Velyka Vasylkivska St, 65",
            "city": "Kyiv",
            "lat": 50.4319,
            "lon": 30.5166,
            "start_datetime": start_dt,
            "min_players": 2,
            "max_players": 4,
        },
    )
    assert explicit_res.status_code == 201
    ev_id = explicit_res.json()["event_id"]
    detail_res = await async_client.get(f"/api/v1/events/{ev_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["lat"] == pytest.approx(50.4319)
    assert detail_res.json()["lon"] == pytest.approx(30.5166)

    # 2. Omitted coordinates -> geocoded via GeocodingService
    with patch.object(
        GeocodingService,
        "geocode",
        AsyncMock(
            return_value=[
                GeocodeResult(
                    display_name="Rynok Square, 10, Lviv",
                    address="Rynok Square 10",
                    city="Lviv",
                    country_code="UA",
                    lat=49.8419,
                    lon=24.0315,
                )
            ]
        ),
    ):
        geo_res = await async_client.post(
            "/api/v1/events",
            headers=headers,
            json={
                "title": "Geocoded Event",
                "description": "Coordinates resolved by backend geocoder.",
                "game_title": "Catan",
                "address": "Rynok Square, 10",
                "city": "Lviv",
                "start_datetime": start_dt,
                "min_players": 2,
                "max_players": 4,
            },
        )
    assert geo_res.status_code == 201
    geo_ev_id = geo_res.json()["event_id"]
    geo_detail = await async_client.get(f"/api/v1/events/{geo_ev_id}", headers=headers)
    assert geo_detail.json()["lat"] == pytest.approx(49.8419)
    assert geo_detail.json()["lon"] == pytest.approx(24.0315)

    # 3. Geocoder down -> falls back to city center + schedules background task
    with (
        patch.object(GeocodingService, "geocode", AsyncMock(return_value=[])),
        patch(
            "app.modules.events.tasks.geocode_event_coordinates.kiq",
            new=AsyncMock(),
        ) as mock_kiq,
    ):
        fallback_res = await async_client.post(
            "/api/v1/events",
            headers=headers,
            json={
                "title": "Fallback City Coords Event",
                "description": "Geocoder down fallback test.",
                "game_title": "Brass",
                "address": "Some New Venue, 1",
                "city": "Kyiv",
                "start_datetime": (datetime.now(UTC) + timedelta(days=3)).isoformat(),
                "min_players": 2,
                "max_players": 4,
            },
        )
    assert fallback_res.status_code == 201
    mock_kiq.assert_awaited_once()


def _photon_feature(
    *, name: str | None, street: str | None, house: str | None, lon: float, lat: float
) -> dict[str, object]:
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "name": name,
            "street": street,
            "housenumber": house,
            "city": "Харків",
            "countrycode": "ua",
        },
    }


@pytest.mark.asyncio
async def test_suggest_parses_photon_and_limits_area_to_the_city() -> None:
    seen_params: dict[str, str] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen_params.update(request.url.params)
        return httpx.Response(
            200,
            json={
                "features": [
                    _photon_feature(
                        name="М'яснова",
                        street="вулиця Бригади Хартія",
                        house="40",
                        lon=36.34526,
                        lat=49.95581,
                    ),
                    _photon_feature(
                        name="Укрпошта",
                        street="вулиця Бригади Хартія",
                        house="40",
                        lon=36.34562,
                        lat=49.95578,
                    ),
                    _photon_feature(
                        name="Сумська вулиця",
                        street=None,
                        house=None,
                        lon=36.2338,
                        lat=49.9947,
                    ),
                ]
            },
        )

    service = GeocodingService(
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
    )
    with (
        patch.object(GeocodingService, "_cache_get", AsyncMock(return_value=None)),
        patch.object(GeocodingService, "_cache_set", AsyncMock()),
    ):
        results = await service.suggest("Бригади Хартія 40", center=(49.99, 36.23))

    assert [r.address for r in results] == [
        "вулиця Бригади Хартія 40",
        "Сумська вулиця",
    ]
    assert results[0].display_name == "М'яснова, вулиця Бригади Хартія 40, Харків"
    assert results[0].country_code == "UA"
    assert results[0].lat == pytest.approx(49.95581)
    assert seen_params["bbox"] == "35.88,49.64,36.58,50.34"


@pytest.mark.asyncio
async def test_suggest_ignores_short_queries_without_calling_the_provider() -> None:
    get_json = AsyncMock()
    with patch.object(GeocodingService, "_get_json", get_json):
        assert await GeocodingService().suggest("Су") == []
    get_json.assert_not_awaited()


@pytest.mark.asyncio
async def test_provider_failure_returns_503_instead_of_an_empty_list(
    async_client: AsyncClient,
) -> None:
    failing = AsyncMock(side_effect=httpx.ConnectError("down"))
    with (
        patch.object(GeocodingService, "_get_json", failing),
        patch.object(GeocodingService, "_cache_get", AsyncMock(return_value=None)),
    ):
        suggest = await async_client.get(
            "/api/v1/locations/suggest", params={"query": "Sumska 10"}
        )
        geocode = await async_client.get(
            "/api/v1/locations/geocode", params={"query": "Sumska 10"}
        )
        assert await GeocodingService().geocode("Sumska 10") == []

    assert suggest.status_code == 503
    assert geocode.status_code == 503


def _service_answering(features: list[dict[str, object]], seen: dict[str, str]):
    def handler(request: httpx.Request) -> httpx.Response:
        seen.update(request.url.params)
        seen["path"] = request.url.path
        return httpx.Response(200, json={"features": features})

    return GeocodingService(
        http_client=httpx.AsyncClient(transport=httpx.MockTransport(handler))
    )


@pytest.mark.asyncio
async def test_typed_address_only_accepts_the_typed_house_number() -> None:
    near_miss = _photon_feature(
        name=None, street="Бригадна вулиця", house="40", lon=36.2542, lat=49.9325
    )
    other_house = _photon_feature(
        name=None, street="Сумська вулиця", house="12", lon=36.2338, lat=49.9947
    )
    right = _photon_feature(
        name=None, street="Сумська вулиця", house="10", lon=36.2330, lat=49.9946
    )
    seen: dict[str, str] = {}
    service = _service_answering([other_house, right], seen)
    with (
        patch.object(GeocodingService, "_cache_get", AsyncMock(return_value=None)),
        patch.object(GeocodingService, "_cache_set", AsyncMock()),
    ):
        found = await service.geocode(
            "Sumska 10", city="Kharkiv", center=(49.99, 36.23), limit=1
        )
        assert [r.address for r in found] == ["Сумська вулиця 10"]
        assert seen["q"] == "Sumska 10, Kharkiv"
        assert seen["bbox"] == "35.88,49.64,36.58,50.34"

        service = _service_answering([near_miss], {})
        assert await service.geocode("Bryhadna 41") == []
        assert len(await service.geocode("Bryhadna 40")) == 1


@pytest.mark.asyncio
async def test_venue_names_without_house_numbers_are_accepted() -> None:
    venue = _photon_feature(
        name="Geek Pub", street="Сумська вулиця", house="10", lon=36.2338, lat=49.9947
    )
    with (
        patch.object(GeocodingService, "_cache_get", AsyncMock(return_value=None)),
        patch.object(GeocodingService, "_cache_set", AsyncMock()),
    ):
        found = await _service_answering([venue], {}).geocode("Geek Pub")
    assert found[0].display_name == "Geek Pub, Сумська вулиця 10, Харків"


@pytest.mark.asyncio
async def test_reverse_geocode_reads_photon_reverse() -> None:
    building = _photon_feature(
        name=None,
        street="вулиця Бригади Хартія",
        house="40",
        lon=36.344967,
        lat=49.9558417,
    )
    seen: dict[str, str] = {}
    with (
        patch.object(GeocodingService, "_cache_get", AsyncMock(return_value=None)),
        patch.object(GeocodingService, "_cache_set", AsyncMock()),
    ):
        result = await _service_answering([building], seen).reverse_geocode(
            49.9558, 36.345
        )
    assert seen["path"] == "/reverse"
    assert result is not None
    assert result.address == "вулиця Бригади Хартія 40"
    assert result.city == "Харків"
