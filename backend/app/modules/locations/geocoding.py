import hashlib
import json
import logging
from typing import Any

import httpx
import redis.asyncio as aioredis

from app.core.config import settings
from app.modules.locations.schemas import GeocodeResult, ReverseGeocodeResult

logger = logging.getLogger("yupiboard.geocoding")


def _extract_city(address: dict[str, Any]) -> str | None:
    for key in ("city", "town", "village", "municipality", "state"):
        val = address.get(key)
        if isinstance(val, str) and val.strip():
            return val.strip()
    return None


def _extract_street_address(address: dict[str, Any], fallback: str) -> str:
    road = address.get("road") or address.get("pedestrian") or address.get("suburb")
    house = address.get("house_number")
    if isinstance(road, str) and road.strip():
        return f"{road.strip()} {house}".strip() if house else road.strip()
    return fallback


class GeocodingService:
    """OpenStreetMap Nominatim geocoding client with Redis caching."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        redis_url: str | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (base_url or settings.GEOCODER_BASE_URL).rstrip("/")
        self.redis_url = redis_url or settings.REDIS_URL
        self._http_client = http_client

    async def _cache_get(self, key: str) -> str | None:
        client = aioredis.from_url(self.redis_url, decode_responses=True)
        try:
            val = await client.get(key)
            return val if isinstance(val, str) else None
        except Exception as exc:  # noqa: BLE001
            logger.debug("Geocode cache read skipped (%s): %s", key, exc)
            return None
        finally:
            await client.aclose()

    async def _cache_set(self, key: str, value: str) -> None:
        client = aioredis.from_url(self.redis_url, decode_responses=True)
        try:
            await client.set(key, value, ex=settings.GEOCODER_CACHE_TTL_SECONDS)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Geocode cache write skipped (%s): %s", key, exc)
        finally:
            await client.aclose()

    async def _get_json(self, path: str, params: dict[str, Any]) -> Any:
        headers = {"User-Agent": settings.GEOCODER_USER_AGENT}
        if self._http_client is not None:
            response = await self._http_client.get(
                f"{self.base_url}{path}",
                params=params,
                headers=headers,
                timeout=settings.GEOCODER_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            return response.json()

        async with httpx.AsyncClient(
            timeout=settings.GEOCODER_TIMEOUT_SECONDS,
            headers=headers,
        ) as client:
            response = await client.get(f"{self.base_url}{path}", params=params)
            response.raise_for_status()
            return response.json()

    async def geocode(
        self, query: str, *, city: str | None = None, limit: int = 5
    ) -> list[GeocodeResult]:
        clean_query = query.strip()
        if not clean_query:
            return []
        search_text = (
            f"{clean_query}, {city.strip()}" if city and city.strip() else clean_query
        )
        cache_digest = hashlib.sha256(
            f"{search_text.lower()}|{limit}".encode()
        ).hexdigest()
        cache_key = f"geocode:fwd:{cache_digest}"

        cached = await self._cache_get(cache_key)
        if cached is not None:
            try:
                raw_items = json.loads(cached)
                return [GeocodeResult.model_validate(item) for item in raw_items]
            except Exception as exc:  # noqa: BLE001
                logger.debug("Ignoring stale forward geocode cache entry: %s", exc)

        try:
            payload = await self._get_json(
                "/search",
                {
                    "q": search_text,
                    "format": "jsonv2",
                    "addressdetails": 1,
                    "limit": limit,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Forward geocoding failed for %r: %s", search_text, exc)
            return []

        if not isinstance(payload, list):
            return []

        results: list[GeocodeResult] = []
        for item in payload:
            if not isinstance(item, dict):
                continue
            try:
                lat = float(item["lat"])
                lon = float(item["lon"])
            except KeyError, TypeError, ValueError:
                continue
            display_name = str(item.get("display_name") or search_text)
            address_obj = item.get("address")
            addr_dict = address_obj if isinstance(address_obj, dict) else {}
            country_code = addr_dict.get("country_code")
            results.append(
                GeocodeResult(
                    display_name=display_name,
                    address=_extract_street_address(addr_dict, display_name),
                    city=_extract_city(addr_dict) or (city.strip() if city else None),
                    country_code=(
                        country_code.upper()
                        if isinstance(country_code, str) and len(country_code) == 2
                        else None
                    ),
                    lat=lat,
                    lon=lon,
                )
            )

        await self._cache_set(cache_key, json.dumps([r.model_dump() for r in results]))
        return results

    async def reverse_geocode(
        self, lat: float, lon: float
    ) -> ReverseGeocodeResult | None:
        cache_key = f"geocode:rev:{lat:.5f}:{lon:.5f}"
        cached = await self._cache_get(cache_key)
        if cached is not None:
            try:
                if cached == "null":
                    return None
                return ReverseGeocodeResult.model_validate(json.loads(cached))
            except Exception as exc:  # noqa: BLE001
                logger.debug("Ignoring stale reverse geocode cache entry: %s", exc)

        try:
            payload = await self._get_json(
                "/reverse",
                {
                    "lat": lat,
                    "lon": lon,
                    "format": "jsonv2",
                    "addressdetails": 1,
                },
            )
        except Exception as exc:  # noqa: BLE001
            logger.warning("Reverse geocoding failed for (%s, %s): %s", lat, lon, exc)
            return None

        if not isinstance(payload, dict) or payload.get("error"):
            await self._cache_set(cache_key, "null")
            return None

        try:
            parsed_lat = float(payload.get("lat", lat))
            parsed_lon = float(payload.get("lon", lon))
        except TypeError, ValueError:
            parsed_lat, parsed_lon = lat, lon

        display_name = str(payload.get("display_name") or f"{lat}, {lon}")
        address_obj = payload.get("address")
        addr_dict = address_obj if isinstance(address_obj, dict) else {}
        country_code = addr_dict.get("country_code")
        result = ReverseGeocodeResult(
            display_name=display_name,
            address=_extract_street_address(addr_dict, display_name),
            city=_extract_city(addr_dict),
            country_code=(
                country_code.upper()
                if isinstance(country_code, str) and len(country_code) == 2
                else None
            ),
            lat=parsed_lat,
            lon=parsed_lon,
        )
        await self._cache_set(cache_key, json.dumps(result.model_dump()))
        return result
