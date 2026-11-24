import { geocodeAddressApiV1LocationsGeocodeGet } from "@/shared/api/generated/endpoints/locations/locations";
import type { Coordinates } from "@/shared/platform/geolocation";

export class AddressNotFoundError extends Error {
  constructor() {
    super("Address not found");
    this.name = "AddressNotFoundError";
  }
}

export async function geocodeEventAddress(
  address: string,
  city: string,
): Promise<Coordinates | null> {
  const matches = await geocodeAddressApiV1LocationsGeocodeGet({
    query: address,
    city,
    limit: 1,
  }).catch(() => null); // Geocoder unavailable: the backend geocodes the address itself.
  if (matches === null) return null;
  const [match] = matches;
  if (!match) throw new AddressNotFoundError();
  return { lat: match.lat, lon: match.lon };
}
