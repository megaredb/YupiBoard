import type { EventFilters, LocationOption } from "./types"

export const EVENTS_PAGE_SIZE = 6

export const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const

export const DEFAULT_FILTERS: EventFilters = {
  locationId: "kyiv",
  maxDistanceKm: 15,
}

// TODO(api): replace with a locations endpoint once it exists.
export const LOCATION_OPTIONS: LocationOption[] = [
  { id: "kyiv", label: "Kyiv, Ukraine" },
  { id: "lviv", label: "Lviv, Ukraine" },
  { id: "kharkiv", label: "Kharkiv, Ukraine" },
  { id: "dnipro", label: "Dnipro, Ukraine" },
]

export const CREATE_EVENT_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  descriptionMax: 2000,
  seatsMin: 2,
  seatsMax: 20,
  coverMaxBytes: 5 * 1024 * 1024,
  coverTypes: ["image/jpeg", "image/png"],
} as const
