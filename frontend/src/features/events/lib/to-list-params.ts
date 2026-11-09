import type { CityRead, ListEventsApiV1EventsGetParams } from "@/shared/api/generated/model";
import { findCity } from "@/features/events/lib/find-city";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

interface ListParamsInput {
  filters: CatalogFilters;
  cities: CityRead[];
  page: number;
  limit: number;
}

/** Searches around the chosen city's centre. */
export function toListParams({
  filters,
  cities,
  page,
  limit,
}: ListParamsInput): ListEventsApiV1EventsGetParams {
  const city = findCity(cities, filters.city);
  const area = city ? { lat: city.lat, lon: city.lon, radius_km: filters.distance } : {};
  return { ...area, page, limit };
}
