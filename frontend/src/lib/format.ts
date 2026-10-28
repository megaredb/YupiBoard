/** Pure display formatters. No i18n strings in here: callers add words like "Free" or "km away". */

const LOCALE = "en-US"

/** "Olena Kovalenko" -> "OK", "olena@x.com" -> "O" */
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** "Sat, Nov 7 · 17:00". `timeZone` defaults to the browser's zone. */
export function formatCardDate(iso: string, timeZone?: string): string {
  const day = new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  }).format(new Date(iso))
  return `${day} · ${formatTime(iso, timeZone)}`
}

/** "Saturday, November 7, 2026" */
export function formatLongDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone,
  }).format(new Date(iso))
}

/** "17:00" */
export function formatTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(new Date(iso))
}

/** "18:00 – 22:00" (end time omitted when unknown). */
export function formatTimeRange(startsAt: string, endsAt: string | null, timeZone?: string): string {
  const start = formatTime(startsAt, timeZone)
  return endsAt ? `${start} – ${formatTime(endsAt, timeZone)}` : start
}

/** "₴300". Amounts are whole currency units. */
export function formatPrice(amount: number, currency = "UAH"): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Backend sends decimals as strings ("300.00"); anything unparsable counts as free. */
export function parseAmount(value: string | number | null | undefined): number {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

/** "4.2" / "15" */
export function formatKm(km: number): string {
  return Number.isInteger(km) ? String(km) : km.toFixed(1)
}
