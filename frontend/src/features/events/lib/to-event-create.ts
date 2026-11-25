import type { EventCreate } from "@/shared/api/generated/model";
import type { Coordinates } from "@/shared/platform/geolocation";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";

const HOUR_MS = 3_600_000;

export function toEventCreate(
  values: CreateEventFormValues,
  photoUrl: string | null,
  coordinates: Coordinates | null,
): EventCreate {
  const start = new Date(`${values.date}T${values.time}`);
  const end = new Date(start.getTime() + values.durationHours * HOUR_MS);

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
    start_datetime: start.toISOString(),
    end_datetime: end.toISOString(),
    max_players: values.maxPlayers,
    entry_cost: values.price,
    photo_url: photoUrl,
  };
}
