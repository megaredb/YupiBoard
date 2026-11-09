import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { citySchema } from "@/shared/lib/validators/city";
import { contactInfoSchema } from "@/shared/lib/validators/contact-info";
import { personNameSchema } from "@/shared/lib/validators/person-name";

export const BIO_MAX_LENGTH = 500;

/** Field names match `UserUpdate`, so server field errors map back one to one (FORM-6). */
export const completeProfileSchema = z.object({
  first_name: personNameSchema,
  last_name: personNameSchema,
  city: citySchema,
  contact_info: contactInfoSchema,
});

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export const profileSchema = completeProfileSchema.extend({
  bio: z
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, "validation.bioTooLong" satisfies TranslationKey),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Either form: "complete profile" leaves the bio out. */
export type ProfileUpdateValues = CompleteProfileFormValues &
  Partial<Pick<ProfileFormValues, "bio">>;
