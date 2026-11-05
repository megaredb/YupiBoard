import type { EventRead } from "@/shared/api/generated/model";

const MAPS_SEARCH_URL = "https://www.google.com/maps/search/";

/** Searches the written address: the event's coordinates are only its city centre for now. */
export function getEventMapUrl(event: Pick<EventRead, "address" | "city">): string {
  const query = [event.address, event.city].filter(Boolean).join(", ");
  const params = new URLSearchParams({ api: "1", query });
  return `${MAPS_SEARCH_URL}?${params.toString()}`;
}
