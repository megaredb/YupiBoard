import { useQuery } from "@tanstack/react-query";
import { useActiveLanguage } from "@/shared/i18n/language";
import { citiesQueryOptions } from "@/features/locations/api/city-queries";
import { findCityByName } from "@/features/locations/lib/find-city";

/** Falls back to the stored name while the list loads, or for a city the backend no longer lists. */
export function useCityLabel(storedName: string | null | undefined): string | null {
  const { data: cities } = useQuery(citiesQueryOptions(useActiveLanguage()));
  if (!storedName) return null;
  return findCityByName(cities ?? [], storedName)?.name ?? storedName;
}
