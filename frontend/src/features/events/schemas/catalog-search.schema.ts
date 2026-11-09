import { z } from "zod";

export const EVENTS_PAGE_SIZE = 6;

export const DISTANCE_RANGE_KM = { min: 1, max: 50 } as const;

/** Slider bounds of the entry cost filter; the top bound means "and more". */
export const COST_RANGE = { min: 0, max: 1000, step: 10 } as const;

/** "Minimum free seats" slider; the backend accepts up to 20, the UI offers the useful part. */
export const SEATS_FILTER_RANGE = { min: 1, max: 5 } as const;

export const ORGANIZER_RATINGS = [1, 2, 3, 4, 5] as const;

/** Mirrors the `title` query parameter of `GET /events`. */
export const SEARCH_QUERY_MAX_LENGTH = 100;

export const CATALOG_SORTS = [
  "distance-asc",
  "distance-desc",
  "date-asc",
  "date-desc",
  "cost-asc",
  "cost-desc",
] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

const DEFAULT_SORT: CatalogSort = "distance-asc";

const DEFAULT_DISTANCE_KM = 15;

/** Backend city name the catalog opens with; any name it does not know falls back too. */
export const DEFAULT_CITY_NAME = "Kyiv";

function toInteger(min: number, max: number) {
  return (value: unknown) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max ? number : undefined;
  };
}

/** Number within [min, max] or `undefined`, so a hand-edited URL falls back to the default. */
function boundedNumber(min: number, max: number, fallback: number) {
  return z.preprocess(toInteger(min, max), z.number().default(fallback));
}

function optionalBoundedNumber(min: number, max: number) {
  return z.preprocess(toInteger(min, max), z.number().optional());
}

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .catch(undefined);

// The router parses `?q=1830` as a number; a search text is always a string.
const searchQuery = z.preprocess(
  (value) => (typeof value === "number" ? String(value) : value),
  z.string().trim().min(1).max(SEARCH_QUERY_MAX_LENGTH).optional().catch(undefined),
);

/** `/events?city=Lviv&distance=20&sort=date-asc&costMax=0&page=2`; every param is optional. */
export const catalogSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1),
  city: z.string().default(DEFAULT_CITY_NAME),
  distance: boundedNumber(DISTANCE_RANGE_KM.min, DISTANCE_RANGE_KM.max, DEFAULT_DISTANCE_KM),
  q: searchQuery,
  sort: z.enum(CATALOG_SORTS).default(DEFAULT_SORT).catch(DEFAULT_SORT),
  from: isoDate,
  to: isoDate,
  costMin: optionalBoundedNumber(COST_RANGE.min, COST_RANGE.max),
  costMax: optionalBoundedNumber(COST_RANGE.min, COST_RANGE.max),
  seats: optionalBoundedNumber(SEATS_FILTER_RANGE.min, SEATS_FILTER_RANGE.max),
  rating: optionalBoundedNumber(1, ORGANIZER_RATINGS.length),
});

export type CatalogFilters = Omit<z.infer<typeof catalogSearchSchema>, "page">;

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  city: DEFAULT_CITY_NAME,
  distance: DEFAULT_DISTANCE_KM,
  sort: DEFAULT_SORT,
};

/** A 1-based page number; anything else in the URL falls back to the first page. */
export const pageNumberSchema = boundedNumber(1, Number.MAX_SAFE_INTEGER, 1);

/** `?page=2` of the personal event lists (my events, bookings, favorites). */
export const pageSearchSchema = z.object({ page: pageNumberSchema });
