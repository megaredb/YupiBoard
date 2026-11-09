import type { DateRange } from "@/shared/components/date-range-field";
import { toIsoDate } from "@/shared/lib/date/iso-date";

export const DATE_PRESETS = ["today", "weekend", "month"] as const;

export type DatePreset = (typeof DATE_PRESETS)[number];

const SUNDAY = 0;
const SATURDAY = 6;

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** On a Sunday "this weekend" is just today; otherwise the coming Saturday and Sunday. */
function getWeekend(today: Date): [Date, Date] {
  if (today.getDay() === SUNDAY) return [today, today];
  const saturday = addDays(today, SATURDAY - today.getDay());
  return [saturday, addDays(saturday, 1)];
}

export function getDatePresetRange(preset: DatePreset, today = new Date()): DateRange {
  if (preset === "today") return { from: toIsoDate(today), to: toIsoDate(today) };
  if (preset === "weekend") {
    const [from, to] = getWeekend(today);
    return { from: toIsoDate(from), to: toIsoDate(to) };
  }
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { from: toIsoDate(today), to: toIsoDate(monthEnd) };
}

/** The preset that produces exactly this range, if any. */
export function findDatePreset(range: DateRange): DatePreset | undefined {
  return DATE_PRESETS.find((preset) => {
    const presetRange = getDatePresetRange(preset);
    return presetRange.from === range.from && presetRange.to === range.to;
  });
}
