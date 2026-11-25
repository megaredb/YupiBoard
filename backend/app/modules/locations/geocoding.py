import hashlib
import json
import logging
import re
from typing import Any

import httpx
import redis.asyncio as aioredis

from app.core.config import settings
from app.modules.locations.schemas import GeocodeResult, ReverseGeocodeResult

logger = logging.getLogger("yupiboard.geocoding")

CITY_RADIUS_DEGREES = 0.35
SUGGEST_MIN_QUERY_LENGTH = 3
# Photon mixes in streets and buildings without numbers; ask for more to keep enough.
CANDIDATES = 15
HOUSE_NUMBER_RE = re.compile(r"\d+[^\W\d_]?(?:/\d+[^\W\d_]?)?")


class GeocoderUnavailableError(Exception):
    pass


def _house_numbers(text: str) -> set[str]:
    return {match.lower() for match in HOUSE_NUMBER_RE.findall(text)}


def _city_bbox(center: tuple[float, float]) -> str:
    lat, lon = center
    radius = CITY_RADIUS_DEGREES
    corners = (lon - radius, lat - radius, lon + radius, lat + radius)
    return ",".join(f"{value:.6g}" for value in corners)


def _photon_result(feature: Any) -> GeocodeResult | None:
    if not isinstance(feature, dict):
        return None
    props = feature.get("properties")
    geometry = feature.get("geometry")
    if not isinstance(props, dict) or not isinstance(geometry, dict):
        return None
    try:
        lon, lat = (float(value) for value in geometry["coordinates"][:2])
    except KeyError, TypeError, ValueError:
        return None
    name, street, house = (
        props.get("name"),
        props.get("street"),
        props.get("housenumber"),
    )
    if isinstance(street, str) and street:
        address = f"{street} {house}" if isinstance(house, str) and house else street
    elif isinstance(name, str) and name:
        address = name
    else:
        return None
    city = props.get("city") if isinstance(props.get("city"), str) else None
    venue = name if isinstance(name, str) and name and name != address else None
    country_code = props.get("countrycode")
    return GeocodeResult(
        display_name=", ".join(part for part in (venue, address, city) if part),
        address=address,
        house_number=house if isinstance(house, str) and house else None,
        is_street=props.get("type") == "street",
        city=city,
        country_code=(
            country_code.upper()
            if isinstance(country_code, str) and len(country_code) == 2
            else None
        ),
        lat=lat,
        lon=lon,
    )


def _photon_results(payload: Any) -> list[GeocodeResult]:
    features = payload.get("features") if isinstance(payload, dict) else None
    results: list[GeocodeResult] = []
    seen: set[tuple[str, bool, str]] = set()
    for feature in features if isinstance(features, list) else []:
        result = _photon_result(feature)
        if result is None:
            continue
        # Shops in one building share its address at slightly different points; keep
        # street features separate from POIs and distinguish neighboring settlements.
        key = (
            result.address.lower(),
            result.is_street,
            (result.city or "").lower(),
        )
        if key not in seen:
            seen.add(key)
            results.append(result)
    return results


class GeocodingService:
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
        url = f"{self.base_url}{path}"
        headers = {"User-Agent": settings.GEOCODER_USER_AGENT}
        if self._http_client is not None:
            response = await self._http_client.get(
                url,
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
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()

    async def _search(
        self, query: str, center: tuple[float, float] | None, limit: int
    ) -> list[GeocodeResult]:
        cache_digest = hashlib.sha256(
            f"{query.lower()}|{center}|{limit}".encode()
        ).hexdigest()
        cache_key = f"geocode:search:v2:{cache_digest}"
        cached = await self._cache_get(cache_key)
        if cached is not None:
            try:
                return [
                    GeocodeResult.model_validate(item) for item in json.loads(cached)
                ]
            except Exception as exc:  # noqa: BLE001
                logger.debug("Ignoring stale geocode cache entry: %s", exc)

        params: dict[str, Any] = {"q": query, "limit": limit}
        if center is not None:
            params |= {"lat": center[0], "lon": center[1], "bbox": _city_bbox(center)}
        try:
            payload = await self._get_json("/api", params)
        except Exception as exc:
            logger.warning("Geocoding failed for %r: %s", query, exc)
            raise GeocoderUnavailableError from exc

        results = _photon_results(payload)
        await self._cache_set(cache_key, json.dumps([r.model_dump() for r in results]))
        return results

    async def geocode(
        self,
        query: str,
        *,
        city: str | None = None,
        center: tuple[float, float] | None = None,
        limit: int = 5,
        raise_on_failure: bool = False,
    ) -> list[GeocodeResult]:
        """The typed text must name a house number, and only that building counts.
        `raise_on_failure` turns provider errors into an exception instead of []."""
        clean_query = query.strip()
        wanted_numbers = _house_numbers(clean_query)
        if not wanted_numbers:
            return []
        search_text = (
            f"{clean_query}, {city.strip()}" if city and city.strip() else clean_query
        )
        try:
            results = await self._search(search_text, center, CANDIDATES)
        except GeocoderUnavailableError:
            if raise_on_failure:
                raise
            return []

        return [
            result
            for result in results
            if result.house_number and result.house_number.lower() in wanted_numbers
        ][:limit]

    async def suggest(
        self, query: str, *, center: tuple[float, float] | None = None, limit: int = 5
    ) -> list[GeocodeResult]:
        clean_query = query.strip()
        if len(clean_query) < SUGGEST_MIN_QUERY_LENGTH:
            return []
        results = await self._search(clean_query, center, CANDIDATES)
        if _house_numbers(clean_query):
            return [result for result in results if result.house_number][:limit]
        return [result for result in results if result.is_street][:limit]

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
            payload = await self._get_json("/reverse", {"lat": lat, "lon": lon})
        except Exception as exc:  # noqa: BLE001
            logger.warning("Reverse geocoding failed for (%s, %s): %s", lat, lon, exc)
            return None

        results = _photon_results(payload)
        if not results:
            await self._cache_set(cache_key, "null")
            return None
        found = results[0]
        result = ReverseGeocodeResult(
            display_name=found.display_name,
            address=found.address,
            city=found.city,
            country_code=found.country_code,
            lat=found.lat,
            lon=found.lon,
        )
        await self._cache_set(cache_key, json.dumps(result.model_dump()))
        return result
