/** "2026-11-02": a calendar day in the device's time zone, as date inputs use it. */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function getTodayIsoDate(): string {
  return toIsoDate(new Date());
}

export function startOfIsoDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toISOString();
}

export function endOfIsoDate(isoDate: string): string {
  return new Date(`${isoDate}T23:59:59.999`).toISOString();
}
