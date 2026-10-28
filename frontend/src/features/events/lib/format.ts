/** Pure display formatters. No i18n strings in here: callers add words like "Free" or "km away". */

const LOCALE = "en-US"

export function formatCardDate(iso: string, timeZone: string): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(date)
  return `${day} · ${formatTime(iso, timeZone)}`
}

export function formatLongDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date(iso))
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso))
}

/** "18:00 – 22:00 · Kyiv time" (end time omitted when unknown). */
export function formatTimeRange(startsAt: string, endsAt: string | null, timeZone: string): string {
  const start = formatTime(startsAt, timeZone)
  const range = endsAt ? `${start} – ${formatTime(endsAt, timeZone)}` : start
  const city = timeZone.split("/").pop()?.replaceAll("_", " ") ?? timeZone
  return `${range} · ${city} time`
}

/** "₴300". Amounts are whole currency units. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** "4.2" / "15" */
export function formatKm(km: number): string {
  return Number.isInteger(km) ? String(km) : km.toFixed(1)
}
