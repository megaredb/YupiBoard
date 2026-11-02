import type { EventCreate } from "@/shared/api/generated/model"
import { getCity } from "@/features/events/lib/cities"
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema"

/** Form values -> `POST /api/v1/events` body. */
export function toEventCreate(values: CreateEventFormValues, photoUrl: string | null): EventCreate {
  // No geocoding yet: the event is placed at the chosen city's centre.
  const city = getCity(values.city)
  return {
    title: values.title,
    game_title: values.gameTitle,
    description: values.description,
    city: city.name,
    address: values.address,
    lat: city.lat,
    lon: city.lon,
    start_datetime: new Date(`${values.date}T${values.time}`).toISOString(),
    max_players: values.maxPlayers,
    entry_cost: values.price,
    photo_url: photoUrl,
  }
}
