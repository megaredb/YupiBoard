import type { CityRead, EventCreate } from "@/shared/api/generated/model";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";

export function toEventCreate(
  values: CreateEventFormValues,
  city: CityRead,
  photoUrl: string | null,
): EventCreate {
  // The backend has no geocoding for addresses: the event is placed at its city's centre.
  return {
    title: values.title,
    game_title: values.gameTitle,
    description: values.description,
    city: city.name,
    location_name: values.venueName || null,
    address: values.address,
    lat: city.lat,
    lon: city.lon,
    start_datetime: new Date(`${values.date}T${values.time}`).toISOString(),
    max_players: values.maxPlayers,
    entry_cost: values.price,
    photo_url: photoUrl,
  };
}
