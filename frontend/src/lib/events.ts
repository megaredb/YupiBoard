import { useSyncExternalStore } from "react"
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router"
import { z } from "zod"

/** Catalog page size (`limit` for `GET /api/v1/events`). */
export const EVENTS_PAGE_SIZE = 6

export const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const

export interface CityOption {
  id: string
  label: string
  /** Backend `city` value. */
  name: string
  /** City center: used as the search origin and as event coordinates until geocoding exists. */
  lat: number
  lon: number
}

export const CITY_OPTIONS: CityOption[] = [
  { id: "kyiv", label: "Kyiv, Ukraine", name: "Kyiv", lat: 50.4501, lon: 30.5234 },
  { id: "lviv", label: "Lviv, Ukraine", name: "Lviv", lat: 49.8397, lon: 24.0297 },
  { id: "kharkiv", label: "Kharkiv, Ukraine", name: "Kharkiv", lat: 49.9935, lon: 36.2304 },
  { id: "dnipro", label: "Dnipro, Ukraine", name: "Dnipro", lat: 48.4647, lon: 35.0462 },
]

export const DEFAULT_CITY_ID = "kyiv"
export const DEFAULT_DISTANCE_KM = 15

export function getCity(cityId: string): CityOption {
  return CITY_OPTIONS.find((city) => city.id === cityId) ?? CITY_OPTIONS[0]!
}

/** Number within [min, max] or `undefined`, so a hand-edited URL falls back to the default. */
const boundedNumber = (min: number, max: number, fallback: number, integer = false) =>
  z.preprocess((value) => {
    const n = Number(value)
    return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)) ? n : undefined
  }, z.number().default(fallback))

/** URL search params of the catalog (`/events?city=lviv&distance=20&page=2`); all optional. */
export const catalogSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1, true),
  city: z.string().default(DEFAULT_CITY_ID),
  distance: boundedNumber(DISTANCE_RANGE_KM.min, DISTANCE_RANGE_KM.max, DEFAULT_DISTANCE_KM),
})

export type CatalogSearch = z.infer<typeof catalogSearchSchema>

/**
 * Locally remembered event ids.
 * The backend has no "favorites" and no "my bookings" list yet, so the browser remembers
 * which events the user saved / applied to; pages then load each event via `GET /api/v1/events/{id}`.
 */
export type SavedEventsKind = "favorites" | "bookings"

const STORAGE_KEYS: Record<SavedEventsKind, string> = {
  favorites: "yupiboard.favoriteEventIds",
  bookings: "yupiboard.bookedEventIds",
}

const listeners = new Set<() => void>()
const cache = new Map<SavedEventsKind, string[]>()

function readIds(kind: SavedEventsKind): string[] {
  const cached = cache.get(kind)
  if (cached) return cached
  let ids: string[] = []
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS[kind]) ?? "[]")
    if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string")
  } catch {
    // Corrupted storage: start empty.
  }
  cache.set(kind, ids)
  return ids
}

function writeIds(kind: SavedEventsKind, ids: string[]) {
  cache.set(kind, ids)
  localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(ids))
  listeners.forEach((listener) => listener())
}

export function toggleSavedEvent(kind: SavedEventsKind, eventId: string, saved: boolean) {
  const ids = readIds(kind).filter((id) => id !== eventId)
  writeIds(kind, saved ? [eventId, ...ids] : ids)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useSavedEventIds(kind: SavedEventsKind): string[] {
  return useSyncExternalStore(subscribe, () => readIds(kind))
}

/** Go to the previous history entry, or to the catalog on a direct page load. */
export function useGoBack() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()

  return () => {
    if (canGoBack) router.history.back()
    else void navigate({ to: "/events" })
  }
}
