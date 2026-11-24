import type { EventCreate } from "@/shared/api/generated/model";
import type { CreateEventFormValues } from "@/features/events/schemas/create-event.schema";

export function toEventCreate(values: CreateEventFormValues, photoUrl: string | null): EventCreate {
  // No `lat`/`lon`: the backend geocodes `address` within `city` and only falls back to the
  // city centre when the address cannot be found. Sending coordinates would skip geocoding.
  return {
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
