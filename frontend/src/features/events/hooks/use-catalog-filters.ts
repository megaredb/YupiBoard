import { useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { Coordinates } from "@/shared/platform/geolocation";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";
import { usePreferredCity } from "@/features/locations";

const route = getRouteApi("/events/");

interface CatalogFiltersState {
  filters: CatalogFilters;
  page: number;
  /** Any change of filters, search or sort starts again from the first page. */
  applyFilters: (next: CatalogFilters) => void;
  goToPage: (page: number) => void;
}

/** Everything but the device position goes to the URL; the position stays in this page only. */
export function useCatalogFilters(): CatalogFiltersState {
  const { page, city, ...search } = route.useSearch();
  const preferredCity = usePreferredCity();
  const navigate = useNavigate();
  const [myLocation, setMyLocation] = useState<Coordinates | null>(null);
  const urlFilters = { ...search, city: city ?? preferredCity?.canonical_name ?? "" };
  const filters: CatalogFilters = { ...urlFilters, lat: myLocation?.lat, lon: myLocation?.lon };

  return {
    filters,
    page,
    applyFilters: ({ lat, lon, ...next }) => {
      setMyLocation(lat !== undefined && lon !== undefined ? { lat, lon } : null);
      void navigate({ to: "/events", search: { ...next, page: 1 } });
    },
    goToPage: (nextPage) =>
      void navigate({ to: "/events", search: { ...urlFilters, page: nextPage } }),
  };
}
