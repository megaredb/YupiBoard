import { z } from "zod";
import { EventStatus } from "@/shared/api/generated/model";
import { pageNumberSchema } from "@/features/events/schemas/catalog-search.schema";

/** `sort_by` × `sort_order` of `GET /events/my/created` and `GET /bookings/me`. */
export const PERSONAL_LIST_SORTS = ["date-desc", "date-asc", "name-asc", "name-desc"] as const;

export type PersonalListSort = (typeof PERSONAL_LIST_SORTS)[number];

const DEFAULT_SORT: PersonalListSort = "date-desc";

const sortSchema = z.enum(PERSONAL_LIST_SORTS).default(DEFAULT_SORT).catch(DEFAULT_SORT);

export const myBookingsSearchSchema = z.object({
  page: pageNumberSchema,
  sort: sortSchema,
});

export type MyBookingsSearch = z.infer<typeof myBookingsSearchSchema>;

export const myEventsSearchSchema = myBookingsSearchSchema.extend({
  status: z.enum(EventStatus).optional().catch(undefined),
});

export type MyEventsSearch = z.infer<typeof myEventsSearchSchema>;

export const PERSONAL_LIST_SEARCH_DEFAULTS = { page: 1, sort: DEFAULT_SORT } as const;
