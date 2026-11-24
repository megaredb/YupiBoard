import type { EventRead, EventStatus } from "@/shared/api/generated/model";
import { hasEventStarted } from "@/features/events/lib/has-event-started";

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
  event: Pick<EventRead, "status" | "start_datetime" | "review_deadline">,
  now: number = Date.now(),
): AttendancePhase {
  if (NOT_HELD_STATUSES.has(event.status) || !hasEventStarted(event, now)) return "upcoming";
  return now <= Date.parse(event.review_deadline) ? "open" : "closed";
}
