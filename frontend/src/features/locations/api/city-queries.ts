import { queryOptions } from "@tanstack/react-query";
import {
  getSearchCitiesApiV1LocationsCitiesGetQueryKey,
  searchCitiesApiV1LocationsCitiesGet,
} from "@/shared/api/generated/endpoints/locations/locations";
import type { SearchCitiesApiV1LocationsCitiesGetParams } from "@/shared/api/generated/model";

/** The backend's maximum page: the supported cities are a short reference list. */
const CITY_LIST_PARAMS: SearchCitiesApiV1LocationsCitiesGetParams = { limit: 100 };

/** Built from the generated key and fetcher so it also works with `useSuspenseQuery`. */
export function citiesQueryOptions() {
  return queryOptions({
    queryKey: getSearchCitiesApiV1LocationsCitiesGetQueryKey(CITY_LIST_PARAMS),
    queryFn: ({ signal }) =>
      searchCitiesApiV1LocationsCitiesGet(CITY_LIST_PARAMS, undefined, signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
}
