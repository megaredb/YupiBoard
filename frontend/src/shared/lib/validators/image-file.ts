import { z } from "zod"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { IMAGE_LIMITS, isImageMimeType } from "@/shared/lib/image/image-constraints"

/** Optional cover image picked in a form; the upload itself still goes through `prepareImage`. */
export const coverImageFileSchema = z
  .instanceof(File)
  .refine((file) => isImageMimeType(file.type), "validation.coverType" satisfies TranslationKey)
  .refine(
    (file) => file.size <= IMAGE_LIMITS.cover.maxBytes,
    "validation.coverSize" satisfies TranslationKey,
  )
  .nullable()
