import type { EventStatus } from "@/shared/api/generated/model";

export const EVENT_STATUS_LABEL_KEYS = {
  OnModeration: "events.eventStatus.onModeration",
  Rejected: "events.eventStatus.rejected",
  Published: "events.eventStatus.published",
  Ongoing: "events.eventStatus.ongoing",
  Completed: "events.eventStatus.completed",
  Cancelled: "events.eventStatus.cancelled",
} as const satisfies Record<EventStatus, string>;
