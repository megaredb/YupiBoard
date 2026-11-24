import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getGetNotificationCountsApiV1NotificationsCountsGetQueryKey,
  getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey,
  getListNotificationsApiV1NotificationsGetQueryKey,
  streamNotificationsApiV1NotificationsStreamGet,
} from "@/shared/api/generated/endpoints/notifications/notifications";
import { connectSseStream, SSE_REQUEST_OPTIONS } from "@/shared/api/sse";
import { invalidateEventQueries } from "@/features/events";
import { readStreamedEventId } from "@/features/notifications/lib/read-streamed-event-id";

const NOTIFICATION_CREATED = "notification.created";

async function invalidateNotificationQueries(queryClient: QueryClient): Promise<void> {
  const queryKeys = [
    getListNotificationsApiV1NotificationsGetQueryKey(),
    getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey(),
    getGetNotificationCountsApiV1NotificationsCountsGetQueryKey(),
  ];
  await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

/** Keeps the signed-in user's notifications, and the events they mention, live. */
export function useNotificationsStream(): void {
  const queryClient = useQueryClient();

  // ORG-9: subscribes to an external system (the server's notification stream).
  useEffect(() => {
    const controller = new AbortController();
    const refreshNotifications = () => void invalidateNotificationQueries(queryClient);
    const handleNotificationCreated = (rawData: string) => {
      refreshNotifications();
      const eventId = readStreamedEventId(rawData);
      if (eventId) void invalidateEventQueries(queryClient, eventId);
    };

    void connectSseStream({
      open: (signal) => streamNotificationsApiV1NotificationsStreamGet(SSE_REQUEST_OPTIONS, signal),
      signal: controller.signal,
      onMessage: (message) => {
        if (message.event === NOTIFICATION_CREATED) handleNotificationCreated(message.data);
      },
      onReconnect: refreshNotifications,
    });

    return () => controller.abort();
  }, [queryClient]);
}
