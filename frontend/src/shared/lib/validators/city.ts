import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";

/** Mirrors `UserUpdate.city` in the OpenAPI schema. */
const CITY_MAX_LENGTH = 100;

export const citySchema = z
  .string()
  .trim()
  .max(CITY_MAX_LENGTH, "validation.cityTooLong" satisfies TranslationKey);
