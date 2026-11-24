import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey,
  getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey,
  getListMyBookingsApiV1BookingsMeGetQueryKey,
} from "@/shared/api/generated/endpoints/bookings/bookings";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey,
} from "@/shared/api/generated/endpoints/events/events";
import {
  getGetNotificationCountsApiV1NotificationsCountsGetQueryKey,
  getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey,
  getListNotificationsApiV1NotificationsGetQueryKey,
} from "@/shared/api/generated/endpoints/notifications/notifications";
import type { UnreadCountResponse } from "@/shared/api/generated/model";
import { connectSseStream } from "@/shared/api/sse";

const notificationPayloadSchema = z.object({
  metadata_payload: z
    .object({
      event_id: z.string().optional(),
    })
    .nullish(),
});

function extractEventId(rawData: string): string | null {
  try {
    const parsed = notificationPayloadSchema.safeParse(JSON.parse(rawData));
    return parsed.success ? (parsed.data.metadata_payload?.event_id ?? null) : null;
  } catch {
    return null;
  }
}

export function useNotificationsStream(): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    const controller = new AbortController();
    const unreadKey = getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey();

    void connectSseStream({
      path: "/api/v1/notifications/stream",
      requireAuth: true,
      signal: controller.signal,
      onEvent: (message) => {
        if (message.event !== "notification.created") return;

        queryClient.setQueryData<UnreadCountResponse>(unreadKey, (old) => ({
          unread: (old?.unread ?? 0) + 1,
        }));
        void queryClient.invalidateQueries({
          queryKey: getListNotificationsApiV1NotificationsGetQueryKey(),
        });
        void queryClient.invalidateQueries({ queryKey: unreadKey });
        void queryClient.invalidateQueries({
          queryKey: getGetNotificationCountsApiV1NotificationsCountsGetQueryKey(),
        });

        const eventId = extractEventId(message.data);
        if (eventId) {
          void queryClient.invalidateQueries({
            queryKey: getGetEventApiV1EventsEventIdGetQueryKey(eventId),
          });
          void queryClient.invalidateQueries({
            queryKey: getListEventBookingsApiV1EventsEventIdBookingsGetQueryKey(eventId),
          });
          void queryClient.invalidateQueries({
            queryKey: getListEventParticipantsApiV1EventsEventIdParticipantsGetQueryKey(eventId),
          });
          void queryClient.invalidateQueries({
            queryKey: getListMyCreatedEventsApiV1EventsMyCreatedGetQueryKey(),
          });
          void queryClient.invalidateQueries({
            queryKey: getListMyBookingsApiV1BookingsMeGetQueryKey(),
          });
        }
      },
    });

    return () => controller.abort();
  }, [queryClient]);
}
