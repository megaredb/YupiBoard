import type { ApplicationStatus, CreateEventInput, ListEventsParams, PlaceSuggestion } from "../types"
import { EVENTS, MY_BOOKED_EVENTS, MY_HOSTED_EVENTS, PLACES } from "./fixtures"

const events = [...EVENTS]

/** GET /events, filtered by city, distance, text and page. */
export function listEvents({ locationId, page, pageSize, maxDistanceKm, query }: ListEventsParams) {
  const locationName = locationId.toLowerCase()
  const searchTerm = query.trim().toLowerCase()
  const matches = events
    .filter((event) =>
      event.status === "upcoming" &&
      (event.distanceKm ?? 0) <= maxDistanceKm &&
      event.venue.address.toLowerCase().includes(locationName) &&
      `${event.title} ${event.venue.name ?? ""} ${event.venue.address}`.toLowerCase().includes(searchTerm),
    )
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  const start = (page - 1) * pageSize

  return {
    items: matches.slice(start, start + pageSize),
    total: matches.length,
    page,
    pageSize,
  }
}

export type EventCollection = "hosted" | "booked" | "favorites"

export function listEventCollection(collection: EventCollection, page: number, pageSize: number) {
  const source = {
    hosted: MY_HOSTED_EVENTS,
    booked: MY_BOOKED_EVENTS,
    favorites: events.filter((event) => event.viewer.isFavorite),
  }[collection]
  const start = (page - 1) * pageSize

  return {
    items: source.slice(start, start + pageSize),
    total: source.length,
    page,
    pageSize,
  }
}

/** GET /events/{id} */
export function getEvent(eventId: string) {
  const event = events.find((item) => item.id === eventId)
  if (!event) throw new Error("Event not found")
  return event
}

/** POST /events */
export async function createEvent(input: CreateEventInput) {
  const id = `evt_${events.length + 1}`
  const template = events[0]!
  events.push({
    ...template,
    id,
    title: input.title,
    description: input.description,
    coverImageUrl: input.coverImage ? URL.createObjectURL(input.coverImage) : null,
    startsAt: input.startsAt,
    endsAt: null,
    price: input.price,
    seatsTotal: input.seatsTotal,
    seatsTaken: 1,
    isPromoted: false,
    status: "pending_moderation", // hidden from the catalog until "moderated"
    venue: { name: input.venueName, address: input.address, mapUrl: null },
    viewer: { isHost: true, isFavorite: false, applicationStatus: null },
  })
  return { id }
}

/** POST /events/{id}/applications */
export async function applyToEvent(eventId: string): Promise<ApplicationStatus> {
  const event = events.find((item) => item.id === eventId)
  if (!event) throw new Error("Event not found")
  event.viewer.applicationStatus = "pending"
  return "pending"
}

/** PUT|DELETE /events/{id}/favorite */
export async function setFavorite(eventId: string, isFavorite: boolean): Promise<void> {
  const event = events.find((item) => item.id === eventId)
  if (!event) throw new Error("Event not found")
  event.viewer.isFavorite = isFavorite
}

/** GET /places/suggest?q= */
export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const needle = query.trim().toLowerCase()
  return PLACES.filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(needle))
}
