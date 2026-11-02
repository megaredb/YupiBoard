import { isApiError } from "@/shared/api/errors";
import type { TranslationKey } from "@/shared/i18n/translation-key";

const SERVER_ERROR_STATUS = 500;

/**
 * Maps a failed request to a message key. The backend has no stable error codes yet, so the
 * mapping uses the HTTP status only (API-10); `byStatus` adds screen-specific meanings.
 */
export function getApiErrorKey(
  error: unknown,
  fallback: TranslationKey,
  byStatus?: Partial<Record<number, TranslationKey>>,
): TranslationKey {
  if (!isApiError(error)) return fallback;
  if (error.status === null) return "errors.network";
  const specific = byStatus?.[error.status];
  if (specific) return specific;
  if (error.status === 403) return "errors.forbidden";
  if (error.status === 429) return "errors.tooManyRequests";
  if (error.status >= SERVER_ERROR_STATUS) return "errors.serviceUnavailable";
  return fallback;
}
