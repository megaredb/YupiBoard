import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type { ModerationSearch } from "@/features/moderation/schemas/moderation-search.schema";

const route = getRouteApi("/_authenticated/_admin/moderation");

interface ModerationSearchState {
  search: ModerationSearch;
  /** A new tab, query or sort starts again from the first page. */
  applySearch: (next: Partial<Omit<ModerationSearch, "page">>) => void;
  goToPage: (page: number) => void;
}

export function useModerationSearch(): ModerationSearchState {
  const search = route.useSearch();
  const navigate = useNavigate();

  return {
    search,
    applySearch: (next) =>
      void navigate({ to: "/moderation", search: { ...search, ...next, page: 1 } }),
    goToPage: (page) => void navigate({ to: "/moderation", search: { ...search, page } }),
  };
}
