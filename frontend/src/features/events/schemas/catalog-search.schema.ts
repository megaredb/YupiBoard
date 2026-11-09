import { z } from "zod";

export const EVENTS_PAGE_SIZE = 6;

export const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const;

const DEFAULT_DISTANCE_KM = 15;

/** Backend city name the catalog opens with; any name it does not know falls back too. */
export const DEFAULT_CITY_NAME = "Kyiv";

/** Number within [min, max] or `undefined`, so a hand-edited URL falls back to the default. */
function boundedNumber(min: number, max: number, fallback: number) {
  return z.preprocess((value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : undefined;
  }, z.number().default(fallback));
}

/** `/events?city=Lviv&distance=20&page=2`; every param is optional. */
export const catalogSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1),
  city: z.string().default(DEFAULT_CITY_NAME),
  distance: boundedNumber(DISTANCE_RANGE_KM.min, DISTANCE_RANGE_KM.max, DEFAULT_DISTANCE_KM),
});

export type CatalogFilters = Pick<z.infer<typeof catalogSearchSchema>, "city" | "distance">;

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  city: DEFAULT_CITY_NAME,
  distance: DEFAULT_DISTANCE_KM,
};

/** `?page=2` of the personal event lists (my events, bookings, favorites). */
export const pageSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1),
});
