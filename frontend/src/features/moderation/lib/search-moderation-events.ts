import type { EventRead, ModerationQueuePage } from "@/shared/api/generated/model";
import type {
  ModerationSearch,
  ModerationSort,
} from "@/features/moderation/schemas/moderation-search.schema";

// INTERIM: GET /moderation/events must accept `q`, `sort_by` and `sort_order`; then this module
// goes away and the page asks the backend for `{ status, q, sort, page, limit }` directly.

interface SearchModerationEventsParams extends Pick<ModerationSearch, "q" | "sort" | "page"> {
  limit: number;
}

const SORT_VALUES: Record<ModerationSort, (event: EventRead) => number> = {
  "created-asc": (event) => Date.parse(event.created_at),
  "created-desc": (event) => Date.parse(event.created_at),
  "date-asc": (event) => Date.parse(event.start_datetime),
  "date-desc": (event) => Date.parse(event.start_datetime),
  "cost-asc": (event) => Number(event.entry_cost),
  "cost-desc": (event) => Number(event.entry_cost),
};

function matchesQuery(event: EventRead, query: string): boolean {
  const needle = query.toLowerCase();
  return [event.title, event.game_title, event.organizer.name].some((field) =>
    field.toLowerCase().includes(needle),
  );
}

/** Searches, sorts and pages one already loaded tab, answering in the backend's page shape. */
export function searchModerationEvents(
  events: readonly EventRead[],
  { q, sort, page, limit }: SearchModerationEventsParams,
): ModerationQueuePage {
  const direction = sort.endsWith("-desc") ? -1 : 1;
  const getValue = SORT_VALUES[sort];
  const matching = q ? events.filter((event) => matchesQuery(event, q)) : [...events];
  matching.sort((a, b) => direction * (getValue(a) - getValue(b)));

  const totalPages = Math.max(1, Math.ceil(matching.length / limit));
  // A page past the end (the list got shorter) is pulled back to the last one.
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * limit;

  return {
    items: matching.slice(start, start + limit),
    total: matching.length,
    page: currentPage,
    total_pages: totalPages,
  };
}
