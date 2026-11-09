from enum import StrEnum


class NotificationType(StrEnum):
    # Requests & Approvals
    BOOKING_REQUESTED = "BOOKING_REQUESTED"
    BOOKING_APPROVED = "BOOKING_APPROVED"
    BOOKING_REJECTED = "BOOKING_REJECTED"
    BOOKING_CANCELLED_BY_PLAYER = "BOOKING_CANCELLED_BY_PLAYER"
    BOOKING_REMOVED_BY_ORGANIZER = "BOOKING_REMOVED_BY_ORGANIZER"
    WAITLIST_PROMOTED = "WAITLIST_PROMOTED"
    EVENT_APPROVED = "EVENT_APPROVED"
    EVENT_REJECTED = "EVENT_REJECTED"
    # Event Updates
    REMINDER_24H = "REMINDER_24H"
    REMINDER_2H = "REMINDER_2H"
    EVENT_UPDATED = "EVENT_UPDATED"
    EVENT_CANCELLED = "EVENT_CANCELLED"
    NEW_EVENT_FROM_FOLLOWED = "NEW_EVENT_FROM_FOLLOWED"
    REVIEW_REMINDER = "REVIEW_REMINDER"


class NotificationCategory(StrEnum):
    REQUESTS = "Requests"
    EVENT_UPDATES = "EventUpdates"
    SYSTEM = "System"


NOTIFICATION_CATEGORY: dict[NotificationType, NotificationCategory] = {
    NotificationType.BOOKING_REQUESTED: NotificationCategory.REQUESTS,
    NotificationType.BOOKING_APPROVED: NotificationCategory.REQUESTS,
    NotificationType.BOOKING_REJECTED: NotificationCategory.REQUESTS,
    NotificationType.BOOKING_CANCELLED_BY_PLAYER: NotificationCategory.REQUESTS,
    NotificationType.BOOKING_REMOVED_BY_ORGANIZER: NotificationCategory.REQUESTS,
    NotificationType.WAITLIST_PROMOTED: NotificationCategory.REQUESTS,
    NotificationType.EVENT_APPROVED: NotificationCategory.REQUESTS,
    NotificationType.EVENT_REJECTED: NotificationCategory.REQUESTS,
    NotificationType.REMINDER_24H: NotificationCategory.EVENT_UPDATES,
    NotificationType.REMINDER_2H: NotificationCategory.EVENT_UPDATES,
    NotificationType.EVENT_UPDATED: NotificationCategory.EVENT_UPDATES,
    NotificationType.EVENT_CANCELLED: NotificationCategory.EVENT_UPDATES,
    NotificationType.NEW_EVENT_FROM_FOLLOWED: NotificationCategory.EVENT_UPDATES,
    NotificationType.REVIEW_REMINDER: NotificationCategory.EVENT_UPDATES,
}


def types_for(category: NotificationCategory) -> list[NotificationType]:
    return [t for t, c in NOTIFICATION_CATEGORY.items() if c is category]
