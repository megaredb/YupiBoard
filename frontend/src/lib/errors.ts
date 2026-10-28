import axios from "axios"
import i18n from "@/i18n"

/**
 * Turn an API error into a displayable string. FastAPI returns `detail` as a string
 * for app errors but as an array of `{ msg }` objects for 422 validation errors.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return i18n.t("errors.serviceUnavailable")

  const status = error.response.status
  const detail: unknown = error.response.data?.detail

  if (typeof detail === "string") {
    const lower = detail.toLowerCase()
    if (lower.includes("ban") || lower.includes("block") || lower.includes("inactive")) {
      return i18n.t("errors.accountBanned")
    }
    return detail
  }

  if (status === 403) return i18n.t("errors.accountBanned")
  if (status === 503 || status === 502 || status === 504) {
    return i18n.t("errors.serviceUnavailable")
  }
  if (status === 401) return i18n.t("errors.authFailed")

  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item as { msg?: unknown })?.msg)
      .filter((msg): msg is string => typeof msg === "string")
    if (messages.length > 0) return messages.join(". ")
  }
  return fallback
}
