import type { TranslationKey } from "@/shared/i18n/translation-key";
import type {
  ModerationSort,
  ModerationTab,
} from "@/features/moderation/schemas/moderation-search.schema";

export const MODERATION_TAB_LABEL_KEYS = {
  pending: "moderation.tabs.pending",
  approved: "moderation.tabs.approved",
  rejected: "moderation.tabs.rejected",
} as const satisfies Record<ModerationTab, TranslationKey>;

export const MODERATION_SORT_LABEL_KEYS = {
  "created-asc": "moderation.sort.createdAsc",
  "created-desc": "moderation.sort.createdDesc",
  "date-asc": "moderation.sort.dateAsc",
  "date-desc": "moderation.sort.dateDesc",
  "cost-asc": "moderation.sort.costAsc",
  "cost-desc": "moderation.sort.costDesc",
} as const satisfies Record<ModerationSort, TranslationKey>;

export const MODERATION_EMPTY_KEYS = {
  pending: {
    title: "moderation.empty.pendingTitle",
    description: "moderation.empty.pendingDescription",
  },
  approved: {
    title: "moderation.empty.approvedTitle",
    description: "moderation.empty.approvedDescription",
  },
  rejected: {
    title: "moderation.empty.rejectedTitle",
    description: "moderation.empty.rejectedDescription",
  },
} as const satisfies Record<ModerationTab, { title: TranslationKey; description: TranslationKey }>;
