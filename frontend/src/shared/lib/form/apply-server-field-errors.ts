import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";
import { isApiError } from "@/shared/api/errors";
import type { TranslationKey } from "@/shared/i18n/translation-key";

/**
 * Marks the fields the server rejected (FORM-6). Backend messages are never shown (ERR-2), so
 * each field gets the generic "invalid" message. Returns whether any field was matched.
 */
export function applyServerFieldErrors<TValues extends FieldValues>(
  error: unknown,
  fields: readonly FieldPath<TValues>[],
  setError: UseFormSetError<TValues>,
): boolean {
  if (!isApiError(error) || !error.fieldErrors) return false;
  const rejected = fields.filter((field) => field in (error.fieldErrors ?? {}));
  rejected.forEach((field) =>
    setError(field, { message: "validation.serverRejected" satisfies TranslationKey }),
  );
  return rejected.length > 0;
}
