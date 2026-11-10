import type { CityRead } from "@/shared/api/generated/model";
import type { Coordinates } from "@/shared/platform/geolocation";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle (haversine) distance in kilometres. */
function distanceKm(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

export function findNearestCity(cities: CityRead[], position: Coordinates): CityRead | undefined {
  let nearest: CityRead | undefined;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (const city of cities) {
    const distance = distanceKm(position, city);
    if (distance < nearestDistance) {
      nearest = city;
      nearestDistance = distance;
    }
  }
  return nearest;
}
