/** "2026-11-02": the `min` of a date input. */
export function getTodayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}
