import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

const route = getRouteApi("/events/");

interface CatalogFiltersState {
  filters: CatalogFilters;
  page: number;
  applyFilters: (next: CatalogFilters) => void;
  goToPage: (page: number) => void;
}

/** Filters and page live in the URL so they survive reload and sharing (ST-2). */
export function useCatalogFilters(): CatalogFiltersState {
  const { city, distance, page } = route.useSearch();
  const navigate = useNavigate();

  return {
    filters: { city, distance },
    page,
    applyFilters: (next) => void navigate({ to: "/events", search: { ...next, page: 1 } }),
    goToPage: (nextPage) =>
      void navigate({ to: "/events", search: { city, distance, page: nextPage } }),
  };
}
