import type { QueryClient } from "@tanstack/react-query";
import { citiesQueryOptions } from "@/features/events/api/city-queries";
import { catalogQueryOptions } from "@/features/events/api/event-queries";
import type { CatalogFilters } from "@/features/events/schemas/catalog-search.schema";

/** Loader of `/events`: the search area comes from the city list, so cities load first. */
export async function loadCatalog(
  queryClient: QueryClient,
  { page, ...filters }: CatalogFilters & { page: number },
): Promise<void> {
  const cities = await queryClient.query({ ...citiesQueryOptions(), staleTime: "static" });
  await queryClient.query({ ...catalogQueryOptions(filters, cities, page), staleTime: "static" });
}
