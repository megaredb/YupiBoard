import {
  useSavedEventsStore,
  type SavedEventsKind,
} from "@/features/saved-events/lib/saved-events-store";

export function useSavedEventIds(kind: SavedEventsKind): string[] {
  return useSavedEventsStore((state) => state[kind]);
}
