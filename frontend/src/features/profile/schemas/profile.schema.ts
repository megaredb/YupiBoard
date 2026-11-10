import { z } from "zod";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { citySchema } from "@/shared/lib/validators/city";
import { contactInfoSchema } from "@/shared/lib/validators/contact-info";
import { personNameSchema } from "@/shared/lib/validators/person-name";

export const BIO_MAX_LENGTH = 500;

const profileBaseSchema = z.object({
  first_name: personNameSchema,
  last_name: personNameSchema,
  city: citySchema,
  contact_info: contactInfoSchema,
});

/** Field names match `UserUpdate`, so server field errors map back one to one (FORM-6). */
export const completeProfileSchema = profileBaseSchema;

export type CompleteProfileFormValues = z.infer<typeof completeProfileSchema>;

export const profileSchema = profileBaseSchema.extend({
  bio: z
    .string()
    .trim()
    .max(BIO_MAX_LENGTH, "validation.bioTooLong" satisfies TranslationKey),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export type ProfileUpdateValues = z.infer<typeof profileBaseSchema> &
  Partial<Pick<ProfileFormValues, "bio">>;
