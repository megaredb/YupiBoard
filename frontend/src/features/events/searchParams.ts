import { z } from "zod"
import { DEFAULT_FILTERS, DISTANCE_RANGE_KM } from "./constants"

/** Number within [min, max] or `undefined`, so a hand-edited URL falls back to the default. */
const boundedNumber = (min: number, max: number, fallback: number, integer = false) =>
  z.preprocess((value) => {
    const n = Number(value)
    return Number.isFinite(n) && n >= min && n <= max && (!integer || Number.isInteger(n)) ? n : undefined
  }, z.number().default(fallback))

/** URL search params of the catalog (`/events?page=2&distance=20`); all optional. */
export const catalogSearchSchema = z.object({
  page: boundedNumber(1, Number.MAX_SAFE_INTEGER, 1, true),
  location: z.string().default(DEFAULT_FILTERS.locationId),
  distance: boundedNumber(DISTANCE_RANGE_KM.min, DISTANCE_RANGE_KM.max, DEFAULT_FILTERS.maxDistanceKm),
  q: z.string().max(100).default(""),
})
