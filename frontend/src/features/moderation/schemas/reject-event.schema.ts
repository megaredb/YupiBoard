import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";

/** Bounds of `EventRejectRequest.reason`. */
const REJECT_REASON_MIN_LENGTH = 3;
export const REJECT_REASON_MAX_LENGTH = 1000;

const LENGTH_MESSAGE = "validation.rejectReasonLength" satisfies TranslationKey;

export const rejectEventSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(REJECT_REASON_MIN_LENGTH, LENGTH_MESSAGE)
    .max(REJECT_REASON_MAX_LENGTH, LENGTH_MESSAGE),
});

export type RejectEventFormValues = z.infer<typeof rejectEventSchema>;
