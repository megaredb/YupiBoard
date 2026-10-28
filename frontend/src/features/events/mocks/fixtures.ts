import type { EventDetails, Organizer, PlaceSuggestion } from "../types"

const HOUR = 3_600_000
const DAY = 24 * HOUR

const ORGANIZER: Organizer = {
  id: "org_1",
  fullName: "Oleksii Kovalenko",
  avatarUrl: "https://picsum.photos/seed/org_1/120/120",
  rating: 4.8,
  reviewsCount: 24,
  eventsHosted: 28,
  memberSince: "2023-05-20",
}

const TITLES = [
  "Trade, build & make new friends",
  "Dune: Imperium Tournament Night",
  "Catan & Expansions Night",
  "Wingspan and wine",
  "Ark Nova for beginners",
  "Carcassonne evening",
]

const DESCRIPTION =
  "Join a small table of fellow strategists for an evening of good games and good company.\n\n1. learn the rules\n2. be funny"

/** 24 upcoming events, starts always in the future so the mock never goes stale. */
export const EVENTS: EventDetails[] = Array.from({ length: 24 }, (_, i) => {
  const startsAt = new Date(Date.now() + ((i % 14) + 1) * DAY)
  startsAt.setUTCHours(15, 0, 0, 0)
  const seatsTotal = [6, 4, 8][i % 3]!

  return {
    id: `evt_${i + 1}`,
    title: TITLES[i % TITLES.length]!,
    coverImageUrl: `https://picsum.photos/seed/boardgame-${i % 6}/800/500`,
    startsAt: startsAt.toISOString(),
    endsAt: new Date(startsAt.getTime() + 4 * HOUR).toISOString(),
    timezone: "Europe/Kyiv",
    distanceKm: 1 + ((i * 7) % 45),
    price: i % 3 === 0 ? 0 : [150, 300, 200][i % 3]!,
    currency: "UAH",
    status: "upcoming",
    isPromoted: i % 5 === 0,
    seatsTaken: 1 + (i % (seatsTotal - 1)),
    seatsTotal,
    organizer: ORGANIZER,
    description: DESCRIPTION,
    venue: { name: "The Guild · Board Game Café", address: "24 Mezhyhirska St, Kyiv", mapUrl: "https://maps.google.com" },
    viewer: { isHost: false, isFavorite: false, applicationStatus: null },
  }
})

export const PLACES: PlaceSuggestion[] = [
  { id: "p1", name: "Geekach — board game club", address: "17B Kostiantynivska St, Kyiv" },
  { id: "p2", name: "Ігромаг — board game store & club", address: "8 Ivana Franka St, Kyiv" },
  { id: "p3", name: "The Guild · Board Game Café", address: "24 Mezhyhirska St, Kyiv" },
]
