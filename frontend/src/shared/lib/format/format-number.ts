import { getActiveLocale } from "@/shared/i18n/active-locale";

/** "₴300". Amounts are whole currency units; the currency always comes from the caller. */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat(getActiveLocale(), {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** "4.2" / "15" */
export function formatDecimal(value: number, maximumFractionDigits = 1): string {
  return new Intl.NumberFormat(getActiveLocale(), { maximumFractionDigits }).format(value);
}

/** Backend sends decimals as strings ("300.00"); anything unparsable counts as zero. */
export function parseDecimal(value: string | number | null | undefined): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}
