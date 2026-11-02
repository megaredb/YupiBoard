// INTERIM: the backend must provide favorites endpoints (add/remove/list favorite events) and a
// "my bookings" list. Until then the ids live on this device only, per user, wiped on logout.
// The UI never presents them as saved on the server.
import { z } from "zod"
import { create } from "zustand"
import { readUserValue, writeUserValue } from "@/shared/platform/storage"

export type SavedEventsKind = "favorites" | "bookings"

const STORAGE_KEYS: Record<SavedEventsKind, string> = {
  favorites: "favorite-event-ids",
  bookings: "booked-event-ids",
}

const idsSchema = z.array(z.string())

interface SavedEventsState {
  userId: string | null
  favorites: string[]
  bookings: string[]
}

const EMPTY_STATE: SavedEventsState = { userId: null, favorites: [], bookings: [] }

export const useSavedEventsStore = create<SavedEventsState>(() => EMPTY_STATE)

async function readIds(userId: string, kind: SavedEventsKind): Promise<string[]> {
  const raw = await readUserValue(userId, STORAGE_KEYS[kind])
  if (!raw) return []
  try {
    const parsed = idsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : []
  } catch {
    // Corrupted value: start over with an empty list.
    return []
  }
}

/** Loads the ids of `userId` once; later calls for the same user are no-ops. */
export async function loadSavedEvents(userId: string | null): Promise<void> {
  if (useSavedEventsStore.getState().userId === userId) return
  if (!userId) {
    useSavedEventsStore.setState(EMPTY_STATE)
    return
  }
  const [favorites, bookings] = await Promise.all([
    readIds(userId, "favorites"),
    readIds(userId, "bookings"),
  ])
  useSavedEventsStore.setState({ userId, favorites, bookings })
}

export async function setEventSaved(
  kind: SavedEventsKind,
  eventId: string,
  isSaved: boolean,
): Promise<void> {
  const { userId, [kind]: current } = useSavedEventsStore.getState()
  if (!userId) return
  const others = current.filter((id) => id !== eventId)
  const next = isSaved ? [eventId, ...others] : others
  useSavedEventsStore.setState({ [kind]: next })
  await writeUserValue(userId, STORAGE_KEYS[kind], JSON.stringify(next))
}

export function resetSavedEvents(): void {
  useSavedEventsStore.setState(EMPTY_STATE)
}
