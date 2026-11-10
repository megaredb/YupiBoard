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
import type {
  EventRead,
  NotificationPage,
  NotificationRead,
  UnreadCountResponse,
} from "@/shared/api/generated/model";
import { toListState, type ListState } from "@/shared/lib/list-state";

const PREVIEW_LIMIT = 5;
const EXPANDED_LIMIT = 50;
const LIST_PARAMS = { page: 1, limit: EXPANDED_LIMIT } as const;

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
  const query = useListNotificationsApiV1NotificationsGet(LIST_PARAMS, {
    query: { enabled: isOpen },
  });
  const visibleItems = isExpanded ? query.data?.items : query.data?.items.slice(0, PREVIEW_LIMIT);
  return {
    list: toListState(query, visibleItems),
    total: query.data?.total ?? 0,
  };
}

export function useNotificationActions(): {
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
} {
  const queryClient = useQueryClient();
  const listKey = getListNotificationsApiV1NotificationsGetQueryKey(LIST_PARAMS);
  const unreadKey = getGetUnreadCountApiV1NotificationsUnreadCountGetQueryKey();

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: getListNotificationsApiV1NotificationsGetQueryKey(),
      }),
      queryClient.invalidateQueries({ queryKey: unreadKey }),
    ]);

  const markOne = useMarkNotificationReadApiV1NotificationsNotificationIdReadPost({
    mutation: {
      onMutate: ({ notificationId }) => {
        queryClient.setQueryData<NotificationPage>(listKey, (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) =>
                  item.id === notificationId ? { ...item, is_read: true } : item,
                ),
              }
            : old,
        );
        queryClient.setQueryData<UnreadCountResponse>(unreadKey, (old) =>
          old ? { unread: Math.max(0, old.unread - 1) } : old,
        );
      },
      onSettled: invalidate,
    },
  });
  const markAll = useMarkAllNotificationsReadApiV1NotificationsReadAllPost({
    mutation: {
      onMutate: () => {
        queryClient.setQueryData<NotificationPage>(listKey, (old) =>
          old
            ? {
                ...old,
                items: old.items.map((item) => ({ ...item, is_read: true })),
              }
            : old,
        );
        queryClient.setQueryData<UnreadCountResponse>(unreadKey, { unread: 0 });
      },
      onSettled: invalidate,
    },
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
