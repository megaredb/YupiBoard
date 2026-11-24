import type { TranslationKey } from "@/shared/i18n/translation-key";
import type {
  ModerationSort,
  ModerationTab,
} from "@/features/moderation/schemas/moderation-search.schema";

export const MODERATION_TAB_LABEL_KEYS = {
  pending: "admin.moderation.tabs.pending",
  approved: "admin.moderation.tabs.approved",
  rejected: "admin.moderation.tabs.rejected",
} as const satisfies Record<ModerationTab, TranslationKey>;

export const MODERATION_SORT_LABEL_KEYS = {
  "created-asc": "admin.moderation.sort.createdAsc",
  "created-desc": "admin.moderation.sort.createdDesc",
  "date-asc": "admin.moderation.sort.dateAsc",
  "date-desc": "admin.moderation.sort.dateDesc",
  "cost-asc": "admin.moderation.sort.costAsc",
  "cost-desc": "admin.moderation.sort.costDesc",
} as const satisfies Record<ModerationSort, TranslationKey>;

export const MODERATION_EMPTY_KEYS = {
  pending: {
    title: "admin.moderation.empty.pendingTitle",
    description: "admin.moderation.empty.pendingDescription",
  },
  approved: {
    title: "admin.moderation.empty.approvedTitle",
    description: "admin.moderation.empty.approvedDescription",
  },
  rejected: {
    title: "admin.moderation.empty.rejectedTitle",
    description: "admin.moderation.empty.rejectedDescription",
  },
} as const satisfies Record<ModerationTab, { title: TranslationKey; description: TranslationKey }>;
