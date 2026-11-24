import type { EventRead, EventStatus } from "@/shared/api/generated/model";

/** Events that never took place can't have attendance (mirrors the backend rule). */
const NOT_HELD_STATUSES: ReadonlySet<EventStatus> = new Set([
  "OnModeration",
  "Rejected",
  "Cancelled",
]);

export type AttendancePhase = "upcoming" | "open" | "closed";

/**
 * `upcoming` — nothing to mark yet (not started, or the event never took place).
 * `open` — the organizer may mark attendance (from the start until the review deadline).
 * `closed` — the review deadline has passed, marks are final.
 */
export function getAttendancePhase(
  {
    status,
    start_datetime,
    review_deadline,
  }: Pick<EventRead, "status" | "start_datetime" | "review_deadline">,
  now: number = Date.now(),
): AttendancePhase {
  if (NOT_HELD_STATUSES.has(status) || now < Date.parse(start_datetime)) return "upcoming";
  return now <= Date.parse(review_deadline) ? "open" : "closed";
}
