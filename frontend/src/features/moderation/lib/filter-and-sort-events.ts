import type { EventRead } from "@/shared/api/generated/model";
import type { ModerationSort } from "@/features/moderation/schemas/moderation-search.schema";

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

export function filterAndSortEvents(
  events: readonly EventRead[],
  query: string | undefined,
  sort: ModerationSort,
): EventRead[] {
  const direction = sort.endsWith("-desc") ? -1 : 1;
  const getValue = SORT_VALUES[sort];
  const matching = query ? events.filter((event) => matchesQuery(event, query)) : [...events];
  return matching.sort((a, b) => direction * (getValue(a) - getValue(b)));
}
