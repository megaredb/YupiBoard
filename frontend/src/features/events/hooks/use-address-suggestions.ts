import { useQuery } from "@tanstack/react-query";
import { getSuggestAddressesApiV1LocationsSuggestGetQueryOptions } from "@/shared/api/generated/endpoints/locations/locations";
import type { GeocodeResult } from "@/shared/api/generated/model";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

/** Mirrors the backend minimum; shorter text matches too much to be useful. */
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 300;
const SUGGESTION_LIMIT = 5;

export type AddressSuggestions =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "unavailable" }
  | { status: "ready"; items: GeocodeResult[] };

export function useAddressSuggestions(text: string, city: string): AddressSuggestions {
  const query = useDebouncedValue(text.trim(), DEBOUNCE_MS);
  const isEnabled = query.length >= MIN_QUERY_LENGTH;
  const suggestions = useQuery({
    ...getSuggestAddressesApiV1LocationsSuggestGetQueryOptions({
      query,
      city: city || undefined,
      limit: SUGGESTION_LIMIT,
    }),
    enabled: isEnabled,
    staleTime: Number.POSITIVE_INFINITY,
  });

  if (!isEnabled) return { status: "idle" };
  if (suggestions.isError) return { status: "unavailable" };
  if (!suggestions.data) return { status: "searching" };
  return { status: "ready", items: suggestions.data };
}
