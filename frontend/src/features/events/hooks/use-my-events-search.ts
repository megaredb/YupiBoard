import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { MyEventsSearch } from "@/features/events/schemas/personal-list-search.schema";

const route = getRouteApi("/_authenticated/my-events");

interface MyEventsSearchState {
  search: MyEventsSearch;
  /** A new status or sort starts again from the first page. */
  applySearch: (next: Partial<Omit<MyEventsSearch, "page">>) => void;
  goToPage: (page: number) => void;
}

export function useMyEventsSearch(): MyEventsSearchState {
  const search = route.useSearch();
  const navigate = useNavigate();

  return {
    search,
    applySearch: (next) =>
      void navigate({ to: "/my-events", search: { ...search, ...next, page: 1 } }),
    goToPage: (page) => void navigate({ to: "/my-events", search: { ...search, page } }),
  };
}
