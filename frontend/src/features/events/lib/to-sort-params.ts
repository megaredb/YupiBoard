import type { PersonalListSort } from "@/features/events/schemas/personal-list-search.schema";

interface SortParams {
  sort_by: "date" | "name";
  sort_order: "asc" | "desc";
}

const SORT_PARAMS = {
  "date-desc": { sort_by: "date", sort_order: "desc" },
  "date-asc": { sort_by: "date", sort_order: "asc" },
  "name-asc": { sort_by: "name", sort_order: "asc" },
  "name-desc": { sort_by: "name", sort_order: "desc" },
} as const satisfies Record<PersonalListSort, SortParams>;

export function toSortParams(sort: PersonalListSort): SortParams {
  return SORT_PARAMS[sort];
}
