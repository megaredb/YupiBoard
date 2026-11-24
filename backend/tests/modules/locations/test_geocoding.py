from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

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
