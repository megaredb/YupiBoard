import type { CityRead } from "@/shared/api/generated/model";

/** The city the app opens with when the user has not chosen a supported one. */
const DEFAULT_CITY_NAME = "Kyiv";

export function findCityByName(cities: CityRead[], name: string | null | undefined) {
  return name ? cities.find((city) => city.name === name) : undefined;
}

/** The preferred city if the backend supports it, else the default city, else the first one. */
export function getPreferredCity(
  cities: CityRead[],
  preferredName: string | null | undefined,
): CityRead | undefined {
  return (
    findCityByName(cities, preferredName) ?? findCityByName(cities, DEFAULT_CITY_NAME) ?? cities[0]
  );
}
