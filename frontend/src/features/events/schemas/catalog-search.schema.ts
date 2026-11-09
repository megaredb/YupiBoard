import { z } from "zod";
import { DEFAULT_CITY_ID } from "@/features/events/lib/cities";

export const EVENTS_PAGE_SIZE = 6;

export const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const;

const DEFAULT_DISTANCE_KM = 15;

/** Number within [min, max] or `undefined`, so a hand-edited URL falls back to the default. */
function boundedNumber(min: number, max: number, fallback: number) {
  return z.preprocess((value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : undefined;
  }, z.number().default(fallback));
}

/** `/events?city=lviv&distance=20&page=2`; every param is optional. */
export const catalogSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1),
  city: z.string().default(DEFAULT_CITY_ID),
  distance: boundedNumber(DISTANCE_RANGE_KM.min, DISTANCE_RANGE_KM.max, DEFAULT_DISTANCE_KM),
});

export type CatalogFilters = Pick<z.infer<typeof catalogSearchSchema>, "city" | "distance">;

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  city: DEFAULT_CITY_ID,
  distance: DEFAULT_DISTANCE_KM,
};

/** `?page=2` of the personal event lists (my events, bookings, favorites). */
export const pageSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1),
});
