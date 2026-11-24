const MS_PER_HOUR = 3_600_000;

/** Whole hours until `deadline`, rounded up so the last hour still reads "1 h left". */
export function getHoursLeft(deadline: string, now: number = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(deadline) - now) / MS_PER_HOUR));
}
