import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";

/** The backend accepts whole stars from 1 to 5. */
export const REVIEW_SCORES = [1, 2, 3, 4, 5] as const;
const REVIEW_SCORE_MIN = 1;
const REVIEW_SCORE_MAX = 5;

const SCORE_MESSAGE = "reviews.dialog.scoreRequired" satisfies TranslationKey;

/** `0` stands for "no star picked yet". */
export const reviewSchema = z.object({
  score: z.number().int().min(REVIEW_SCORE_MIN, SCORE_MESSAGE).max(REVIEW_SCORE_MAX, SCORE_MESSAGE),
});

export type ReviewFormValues = z.infer<typeof reviewSchema>;
