import { useSuspenseQuery } from "@tanstack/react-query";
import type { CityRead } from "@/shared/api/generated/model";
import { citiesQueryOptions } from "@/features/locations/api/city-queries";

/** Loaded by the route loaders of the pages that pick a city. */
export function useCities(): CityRead[] {
  return useSuspenseQuery(citiesQueryOptions()).data;
}
