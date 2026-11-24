import type { EventCreate } from "@/shared/api/generated/model";
import type { Coordinates } from "@/shared/platform/geolocation";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";

export function toEventCreate(
  values: CreateEventFormValues,
  photoUrl: string | null,
  coordinates: Coordinates | null,
): EventCreate {
  return {
    // Without coordinates the backend geocodes `address` within `city` itself.
    lat: coordinates?.lat ?? null,
    lon: coordinates?.lon ?? null,
    title: values.title,
    game_title: values.gameTitle,
    description: values.description,
    city: values.city,
    location_name: values.venueName || null,
    address: values.address,
    start_datetime: new Date(`${values.date}T${values.time}`).toISOString(),
    max_players: values.maxPlayers,
    entry_cost: values.price,
    photo_url: photoUrl,
  };
}
