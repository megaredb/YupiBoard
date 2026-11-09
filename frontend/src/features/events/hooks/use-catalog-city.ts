import type { CityRead } from "@/shared/api/generated/model";
import { useCities } from "@/features/events/hooks/use-cities";
import { findCity } from "@/features/events/lib/find-city";

/** The city the catalog actually searches around, after the unknown-name fallback. */
export function useCatalogCity(cityName: string): CityRead | undefined {
  return findCity(useCities(), cityName);
}
