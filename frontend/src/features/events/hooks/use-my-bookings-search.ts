import { getRouteApi, useNavigate } from "@tanstack/react-router";
import type {
  MyBookingsSearch,
  PersonalListSort,
} from "@/features/events/schemas/personal-list-search.schema";

const route = getRouteApi("/_authenticated/my-bookings");

interface MyBookingsSearchState {
  search: MyBookingsSearch;
  /** A new sort starts again from the first page. */
  applySort: (sort: PersonalListSort) => void;
  goToPage: (page: number) => void;
}

export function useMyBookingsSearch(): MyBookingsSearchState {
  const search = route.useSearch();
  const navigate = useNavigate();

  return {
    search,
    applySort: (sort) => void navigate({ to: "/my-bookings", search: { sort, page: 1 } }),
    goToPage: (page) => void navigate({ to: "/my-bookings", search: { ...search, page } }),
  };
}
