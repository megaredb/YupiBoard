import type { NotificationRead } from "@/shared/api/generated/model";

export function getNotificationEventId(notification: NotificationRead): string | null {
  const raw = notification.metadata_payload?.event_id;
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}
