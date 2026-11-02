import type { ListEventsApiV1EventsGetParams } from "@/shared/api/generated/model";
import { getCity } from "@/features/events/lib/cities";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

export function toListParams(
  filters: CatalogFilters,
  page: number,
  limit: number,
): ListEventsApiV1EventsGetParams {
  const city = getCity(filters.city);
  return { lat: city.lat, lon: city.lon, radius_km: filters.distance, page, limit };
}
