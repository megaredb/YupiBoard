import { z } from "zod";
import { pageNumberSchema } from "@/features/events/schemas/catalog-search.schema";

export const EVENT_BOOKINGS_PAGE_SIZE = 10;

/** `/events/<id>?bookingsPage=2`: the page of the host's booking request list. */
export const eventDetailsSearchSchema = z.object({ bookingsPage: pageNumberSchema });

export const EVENT_DETAILS_SEARCH_DEFAULTS = { bookingsPage: 1 } as const;
