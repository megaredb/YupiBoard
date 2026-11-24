import { z } from "zod";
import { pageSearchSchema } from "@/features/events";

export const MODERATION_TABS = ["pending", "approved", "rejected"] as const;

export type ModerationTab = (typeof MODERATION_TABS)[number];

export const MODERATION_SORTS = ["date-asc", "date-desc", "name-asc", "name-desc"] as const;

export type ModerationSort = (typeof MODERATION_SORTS)[number];

export const MODERATION_QUERY_MAX_LENGTH = 100;

const DEFAULT_TAB: ModerationTab = "pending";
const DEFAULT_SORT: ModerationSort = "date-asc";

export const moderationSearchSchema = pageSearchSchema.extend({
  tab: z.enum(MODERATION_TABS).default(DEFAULT_TAB).catch(DEFAULT_TAB),
  sort: z.enum(MODERATION_SORTS).default(DEFAULT_SORT).catch(DEFAULT_SORT),
  q: z.string().trim().min(1).max(MODERATION_QUERY_MAX_LENGTH).optional().catch(undefined),
});

export type ModerationSearch = z.infer<typeof moderationSearchSchema>;

export const MODERATION_SEARCH_DEFAULTS = {
  page: 1,
  tab: DEFAULT_TAB,
  sort: DEFAULT_SORT,
} as const;
