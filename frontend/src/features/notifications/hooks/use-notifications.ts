import { useQueryClient } from "@tanstack/react-query";
import { useGetEventApiV1EventsEventIdGet } from "@/shared/api/generated/endpoints/events/events";
import {
  getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey,
  getListNotificationsApiV1NotificationsGetQueryKey,
  useGetUnreadCountApiV1NotificationsUnreadCountGet,
  useListNotificationsApiV1NotificationsGet,
  useMarkAllNotificationsReadApiV1NotificationsReadAllPost,
  useMarkNotificationReadApiV1NotificationsNotificationIdReadPost,
} from "@/shared/api/generated/endpoints/notifications/notifications";
import type { EventRead, NotificationRead } from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";

const PREVIEW_LIMIT = 5;
const EXPANDED_LIMIT = 50;

export function useUnreadNotificationsCount(): number {
  const query = useGetUnreadCountApiV1NotificationsUnreadCountGet();
  return query.data?.unread ?? 0;
}

export function useNotificationsList(
  isOpen: boolean,
  isExpanded: boolean,
): {
  list: ListState<NotificationRead>;
  total: number;
} {
  const limit = isExpanded ? EXPANDED_LIMIT : PREVIEW_LIMIT;
  const query = useListNotificationsApiV1NotificationsGet(
    { page: 1, limit },
    { query: { enabled: isOpen } },
  );
  return {
    list: toListState(query, query.data?.items),
    total: query.data?.total ?? 0,
  };
}

export function useNotificationActions(): {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
} {
  const queryClient = useQueryClient();
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListNotificationsApiV1NotificationsGetQueryKey(),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey(),
      }),
    ]);

  const markOne = useMarkNotificationReadApiV1NotificationsNotificationIdReadPost({
    mutation: { onSuccess: invalidate },
  });
  const markAll = useMarkAllNotificationsReadApiV1NotificationsReadAllPost({
    mutation: { onSuccess: invalidate },
  });

  return {
    markAsRead: (notificationId: string) => markOne.mutate({ notificationId }),
    markAllAsRead: () => markAll.mutate(),
  };
}

export function useNotificationEvent(eventId: string | null): EventRead | null {
  const query = useGetEventApiV1EventsEventIdGet(eventId ?? "", {
    query: { enabled: Boolean(eventId) },
  });
  return query.data ?? null;
}
