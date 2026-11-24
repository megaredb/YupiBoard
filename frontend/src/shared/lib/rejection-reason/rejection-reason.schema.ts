import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";

export const REJECTION_REASON_MAX_LENGTH = 300;

interface ReasonChoice {
  presetReasonIds: string[];
  isOtherChecked: boolean;
  otherText: string;
}

function hasAnyReason({ presetReasonIds, isOtherChecked }: ReasonChoice): boolean {
  return presetReasonIds.length > 0 || isOtherChecked;
}

function hasOtherTextWhenChecked({ isOtherChecked, otherText }: ReasonChoice): boolean {
  return !isOtherChecked || otherText.length > 0;
}

export const rejectionReasonSchema = z
  .object({
    presetReasonIds: z.array(z.string()),
    isOtherChecked: z.boolean(),
    otherText: z
      .string()
      .trim()
      .max(REJECTION_REASON_MAX_LENGTH, "validation.reasonTooLong" satisfies TranslationKey),
  })
  .refine(hasAnyReason, {
    path: ["presetReasonIds"],
    message: "validation.reasonRequired" satisfies TranslationKey,
  })
  .refine(hasOtherTextWhenChecked, {
    path: ["otherText"],
    message: "validation.otherReasonRequired" satisfies TranslationKey,
  });

export type RejectionReasonFormValues = z.infer<typeof rejectionReasonSchema>;
