/**
 * Fake backend, one function per endpoint. Only ../api imports it.
 * Delete this whole `mocks/` folder (and lib/mock.ts) when the real hooks are wired.
 */
import { paginate, simulateLatency } from "@/lib/mock"
import type { ApplicationStatus, CreateEventInput, ListEventsParams, PlaceSuggestion } from "../types"
import { EVENTS, PLACES } from "./fixtures"

const events = [...EVENTS]

/** GET /events (`locationId` is ignored by the mock). */
export function listEvents({ page, pageSize, maxDistanceKm }: ListEventsParams) {
  const matches = events
    .filter((event) => event.status === "upcoming" && (event.distanceKm ?? 0) <= maxDistanceKm)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return simulateLatency(paginate(matches, page, pageSize))
}

/** GET /events/{id} */
export async function getEvent(eventId: string) {
  const event = events.find((item) => item.id === eventId)
  if (!event) throw new Error("Event not found")
  return simulateLatency(event)
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
  return simulateLatency({ id }, 600)
}

/** POST /events/{id}/applications */
export async function applyToEvent(eventId: string): Promise<ApplicationStatus> {
  const event = events.find((item) => item.id === eventId)
  if (event) event.viewer.applicationStatus = "pending"
  return simulateLatency("pending")
}

/** PUT|DELETE /events/{id}/favorite */
export async function setFavorite(eventId: string, isFavorite: boolean) {
  const event = events.find((item) => item.id === eventId)
  if (event) event.viewer.isFavorite = isFavorite
  return simulateLatency(undefined, 150)
}

/** GET /places/suggest?q= */
export async function suggestPlaces(query: string): Promise<PlaceSuggestion[]> {
  const needle = query.trim().toLowerCase()
  return simulateLatency(
    PLACES.filter((place) => `${place.name} ${place.address}`.toLowerCase().includes(needle)),
    200,
  )
}
