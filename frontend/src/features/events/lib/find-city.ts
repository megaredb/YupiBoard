import type { CityRead } from "@/shared/api/generated/model";

/** The city with this name; unknown names (e.g. a hand-edited URL) fall back to the first city. */
export function findCity(cities: CityRead[], name: string): CityRead | undefined {
  return cities.find((city) => city.name === name) ?? cities[0];
}
