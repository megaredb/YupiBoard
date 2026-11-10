import type { CityRead } from "@/shared/api/generated/model";

const DEFAULT_CITY_NAME = "Kyiv";

export function findCityByName(cities: CityRead[], name: string | null | undefined) {
  return name ? cities.find((city) => city.name === name) : undefined;
}

export function getPreferredCity(
  cities: CityRead[],
  preferredName: string | null | undefined,
): CityRead | undefined {
  return (
    findCityByName(cities, preferredName) ?? findCityByName(cities, DEFAULT_CITY_NAME) ?? cities[0]
  );
}
