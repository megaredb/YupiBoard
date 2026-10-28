/**
 * Domain models for the events feature: what the UI consumes (camelCase, display-ready).
 * When the real endpoints exist, the hooks in ./api map the generated DTOs (snake_case,
 * src/api/model) to these, so pages and components don't change.
 */

export type EventStatus = "upcoming" | "finished" | "cancelled" | "pending_moderation"

/** Status of the current user's request to join an event. */
export type ApplicationStatus = "pending" | "approved" | "rejected"

export interface Organizer {
  id: string
  fullName: string
  displayName?: string
  avatarUrl: string | null
  /** 0–5 */
  rating: number
  reviewsCount: number
  eventsHosted: number
  /** ISO date */
  memberSince: string
}

export interface Venue {
  name: string | null
  address: string
  mapUrl: string | null
}

/** Everything a catalog card needs. */
export interface EventSummary {
  id: string
  title: string
  coverImageUrl: string | null
  /** ISO 8601 */
  startsAt: string
  /** IANA zone, e.g. "Europe/Kyiv". */
  timezone: string
  distanceKm: number | null
  /** Per player; 0 = free. */
  price: number
  /** ISO 4217 */
  currency: string
  status: EventStatus
  isPromoted: boolean
  seatsTaken: number
  seatsTotal: number
  organizer: Organizer
}

export interface EventDetails extends EventSummary {
  description: string
  endsAt: string | null
  venue: Venue
  viewer: {
    isHost: boolean
    isFavorite: boolean
    applicationStatus: ApplicationStatus | null
  }
}

export interface EventFilters {
  locationId: string
  maxDistanceKm: number
}

export interface ListEventsParams extends EventFilters {
  page: number
  pageSize: number
  query: string
}

export interface CreateEventInput {
  title: string
  description: string
  /** ISO 8601, built from the form's date + time. */
  startsAt: string
  address: string
  venueName: string | null
  seatsTotal: number
  price: number
  coverImage: File | null
}

export interface PlaceSuggestion {
  id: string
  name: string
  address: string
}

export interface LocationOption {
  id: string
  label: string
}
