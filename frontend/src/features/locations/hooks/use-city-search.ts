import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { CityRead } from "@/shared/api/generated/model";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { useActiveLanguage } from "@/shared/i18n/language";
import { citySearchQueryOptions } from "@/features/locations/api/city-queries";

const DEBOUNCE_MS = 250;

export type CitySearch =
  { status: "searching" } | { status: "unavailable" } | { status: "ready"; cities: CityRead[] };

/** The first few cities matching `text`; with nothing typed, the first few cities. */
export function useCitySearch(text: string): CitySearch {
  const language = useActiveLanguage();
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const search = useQuery({
    ...citySearchQueryOptions(query, language),
    placeholderData: keepPreviousData,
  });

  if (search.isError) return { status: "unavailable" };
  if (!search.data) return { status: "searching" };
  return { status: "ready", cities: search.data };
}
