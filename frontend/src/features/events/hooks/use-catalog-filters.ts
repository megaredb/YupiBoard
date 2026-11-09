import { getRouteApi, useNavigate } from "@tanstack/react-router";
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

/** Filters, search, sort and page live in the URL so they survive reload and sharing (ST-2). */
export function useCatalogFilters(): CatalogFiltersState {
  const { page, city, ...search } = route.useSearch();
  const preferredCity = usePreferredCity();
  const navigate = useNavigate();
  const filters: CatalogFilters = { ...search, city: city ?? preferredCity?.name ?? "" };

  return {
    filters,
    page,
    applyFilters: (next) => void navigate({ to: "/events", search: { ...next, page: 1 } }),
    goToPage: (nextPage) =>
      void navigate({ to: "/events", search: { ...filters, page: nextPage } }),
  };
}
