import type {
  CityRead,
  EventSortBy,
  ListEventsApiV1EventsGetParams,
  SortOrder,
} from "@/shared/api/generated/model";
import { endOfIsoDate, startOfIsoDate } from "@/shared/lib/date/iso-date";
import type { CatalogFilters, CatalogSort } from "@/features/events/schemas/catalog-search.schema";
import { findCityByName } from "@/features/locations";

interface ListParamsInput {
  filters: CatalogFilters;
  cities: CityRead[];
  page: number;
  limit: number;
}

const SORT_PARAMS = {
  "distance-asc": ["distance", "asc"],
  "distance-desc": ["distance", "desc"],
  "date-asc": ["start_datetime", "asc"],
  "date-desc": ["start_datetime", "desc"],
  "cost-asc": ["cost", "asc"],
  "cost-desc": ["cost", "desc"],
} as const satisfies Record<CatalogSort, readonly [EventSortBy, SortOrder]>;

export function toListParams({
  filters,
  cities,
  page,
  limit,
}: ListParamsInput): ListEventsApiV1EventsGetParams {
  const city = findCityByName(cities, filters.city);
  const area = city ? { lat: city.lat, lon: city.lon, radius_km: filters.distance } : {};
  const [sortBy, sortOrder] = SORT_PARAMS[filters.sort];
  return {
    ...area,
    title: filters.q,
    date_from: filters.from && startOfIsoDate(filters.from),
    date_to: filters.to && endOfIsoDate(filters.to),
    cost_min: filters.costMin,
    cost_max: filters.costMax,
    available_seats_min: filters.seats,
    organizer_rating_min: filters.rating,
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    limit,
  };
}
