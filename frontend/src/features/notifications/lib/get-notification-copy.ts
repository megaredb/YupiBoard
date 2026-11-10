import type { TFunction } from "i18next";
import type { NotificationRead, NotificationType } from "@/shared/api/generated/model";

const TITLE_KEYS: Record<NotificationType, `notifications.types.${NotificationType}.title`> = {
  BOOKING_REQUESTED: "notifications.types.BOOKING_REQUESTED.title",
  BOOKING_APPROVED: "notifications.types.BOOKING_APPROVED.title",
  BOOKING_REJECTED: "notifications.types.BOOKING_REJECTED.title",
  BOOKING_CANCELLED_BY_PLAYER: "notifications.types.BOOKING_CANCELLED_BY_PLAYER.title",
  BOOKING_REMOVED_BY_ORGANIZER: "notifications.types.BOOKING_REMOVED_BY_ORGANIZER.title",
  WAITLIST_PROMOTED: "notifications.types.WAITLIST_PROMOTED.title",
  EVENT_CANCELLED: "notifications.types.EVENT_CANCELLED.title",
  EVENT_APPROVED: "notifications.types.EVENT_APPROVED.title",
  EVENT_REJECTED: "notifications.types.EVENT_REJECTED.title",
  EVENT_UPDATED: "notifications.types.EVENT_UPDATED.title",
  REMINDER_24H: "notifications.types.REMINDER_24H.title",
  REMINDER_2H: "notifications.types.REMINDER_2H.title",
  NEW_EVENT_FROM_FOLLOWED: "notifications.types.NEW_EVENT_FROM_FOLLOWED.title",
  REVIEW_REMINDER: "notifications.types.REVIEW_REMINDER.title",
};

const REQUESTED_RE = /^(.+) requested a seat at (.+)\.$/;
const APPROVED_RE = /^Great news! Host (.+) has approved your booking request\./;

type EventMessageKey =
  | "notifications.types.BOOKING_REJECTED.message"
  | "notifications.types.BOOKING_CANCELLED_BY_PLAYER.message"
  | "notifications.types.BOOKING_REMOVED_BY_ORGANIZER.message"
  | "notifications.types.WAITLIST_PROMOTED.message"
  | "notifications.types.EVENT_CANCELLED.message";

const EVENT_MESSAGE_RULES: Partial<
  Record<NotificationType, { pattern: RegExp; key: EventMessageKey }>
> = {
  BOOKING_REJECTED: {
    pattern: /^Your booking request for (.+) was declined by the organizer\.$/,
    key: "notifications.types.BOOKING_REJECTED.message",
  },
  BOOKING_CANCELLED_BY_PLAYER: {
    pattern: /^A player cancelled their booking for (.+)\.$/,
    key: "notifications.types.BOOKING_CANCELLED_BY_PLAYER.message",
  },
  BOOKING_REMOVED_BY_ORGANIZER: {
    pattern: /^The organizer has removed your confirmed seat for (.+)\.$/,
    key: "notifications.types.BOOKING_REMOVED_BY_ORGANIZER.message",
  },
  WAITLIST_PROMOTED: {
    pattern: /^The table for (.+) is currently full\./,
    key: "notifications.types.WAITLIST_PROMOTED.message",
  },
  EVENT_CANCELLED: {
    pattern: /^The event (.+) has been cancelled by the organizer\.$/,
    key: "notifications.types.EVENT_CANCELLED.message",
  },
};

function readMetaString(payload: NotificationRead["metadata_payload"], key: string): string | null {
  const value = payload?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function formatRequestedMessage(notification: NotificationRead, t: TFunction): string | null {
  const match = REQUESTED_RE.exec(notification.message);
  const player = readMetaString(notification.metadata_payload, "player_name") ?? match?.[1];
  const event = readMetaString(notification.metadata_payload, "event_title") ?? match?.[2];
  return player && event
    ? t("notifications.types.BOOKING_REQUESTED.message", { player, event })
    : null;
}

function formatApprovedMessage(notification: NotificationRead, t: TFunction): string | null {
  const match = APPROVED_RE.exec(notification.message);
  const host = readMetaString(notification.metadata_payload, "host_name") ?? match?.[1];
  return host ? t("notifications.types.BOOKING_APPROVED.message", { host }) : null;
}

function formatEventMessage(notification: NotificationRead, t: TFunction): string | null {
  const rule = EVENT_MESSAGE_RULES[notification.notification_type];
  if (!rule) return null;
  const event =
    readMetaString(notification.metadata_payload, "event_title") ??
    rule.pattern.exec(notification.message)?.[1];
  return event ? t(rule.key, { event }) : null;
}

function getLocalizedMessage(notification: NotificationRead, t: TFunction): string {
  if (notification.notification_type === "BOOKING_REQUESTED") {
    return formatRequestedMessage(notification, t) ?? notification.message;
  }
  if (notification.notification_type === "BOOKING_APPROVED") {
    return formatApprovedMessage(notification, t) ?? notification.message;
  }
  return formatEventMessage(notification, t) ?? notification.message;
}

export function getNotificationCopy(
  notification: NotificationRead,
  t: TFunction,
): { title: string; message: string } {
  const titleKey = TITLE_KEYS[notification.notification_type];
  return {
    title: titleKey ? t(titleKey) : notification.title,
    message: getLocalizedMessage(notification, t),
  };
}
