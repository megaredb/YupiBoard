import type { QueryClient } from "@tanstack/react-query";
import { getCachedCurrentUser } from "@/features/auth";
import { catalogQueryOptions } from "@/features/events/api/event-queries";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";
import { citiesQueryOptions, getPreferredCity } from "@/features/locations";

type CatalogSearch = Omit<CatalogFilters, "city"> & { city?: string; page: number };

/** Loader of `/events`: the search area comes from the city list, so cities load first. */
export async function loadCatalog(
  queryClient: QueryClient,
  { page, city, ...filters }: CatalogSearch,
): Promise<void> {
  const cities = await queryClient.query({ ...citiesQueryOptions(), staleTime: "static" });
  const searchedCity =
    city ?? getPreferredCity(cities, getCachedCurrentUser(queryClient)?.city)?.name ?? "";
  await queryClient.query({
    ...catalogQueryOptions({ ...filters, city: searchedCity }, cities, page),
    staleTime: "static",
  });
}
