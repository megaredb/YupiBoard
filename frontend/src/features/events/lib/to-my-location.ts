import type { Coordinates } from "@/shared/platform/geolocation";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

/** The city is kept so dismissing the device position falls back to it. */
export function toMyLocation(filters: CatalogFilters, position: Coordinates): CatalogFilters {
  return { ...filters, lat: position.lat, lon: position.lon };
}

export function toCityCenter(filters: CatalogFilters, city = filters.city): CatalogFilters {
  return { ...filters, city, lat: undefined, lon: undefined };
}

export function isUsingMyLocation(filters: Pick<CatalogFilters, "lat" | "lon">): boolean {
  return filters.lat !== undefined && filters.lon !== undefined;
}
