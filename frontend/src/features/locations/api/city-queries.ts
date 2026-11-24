import { queryOptions } from "@tanstack/react-query";
import {
  getSearchCitiesApiV1LocationsCitiesGetQueryKey,
  searchCitiesApiV1LocationsCitiesGet,
} from "@/shared/api/generated/endpoints/locations/locations";
import type { SearchCitiesApiV1LocationsCitiesGetParams } from "@/shared/api/generated/model";
import { getActiveLocale } from "@/shared/i18n/active-locale";

/** The backend's maximum page: the supported cities are a short reference list. */
const CITY_LIST_PARAMS: SearchCitiesApiV1LocationsCitiesGetParams = { limit: 100 };

/** City names come back localized by `Accept-Language`, so the language is part of the key. */
export function citiesQueryOptions(language: string = getActiveLocale()) {
  return queryOptions({
    queryKey: [...getSearchCitiesApiV1LocationsCitiesGetQueryKey(CITY_LIST_PARAMS), { language }],
    queryFn: ({ signal }) =>
      searchCitiesApiV1LocationsCitiesGet(CITY_LIST_PARAMS, undefined, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

/** Most cities a search suggests at once. */
const CITY_SEARCH_LIMIT = 3;

/**
 * Server-side city search: matches the English name and every translation. An empty query
 * returns the first cities alphabetically.
 */
export function citySearchQueryOptions(query: string, language: string) {
  const params: SearchCitiesApiV1LocationsCitiesGetParams = {
    q: query || undefined,
    limit: CITY_SEARCH_LIMIT,
  };
  return queryOptions({
    queryKey: [...getSearchCitiesApiV1LocationsCitiesGetQueryKey(params), { language }],
    queryFn: ({ signal }) => searchCitiesApiV1LocationsCitiesGet(params, undefined, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
