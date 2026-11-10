import { useState } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NotificationRead } from "@/shared/api/generated/model";
import { Button } from "@/shared/ui/button";
import { Popover } from "@/shared/ui/popover";
import { Skeleton } from "@/shared/ui/skeleton";
import { NotificationDetailDialog } from "@/features/notifications/components/notification-detail-dialog";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
  useNotificationActions,
  useNotificationsList,
  useUnreadNotificationsCount,
} from "@/features/notifications/hooks/use-notifications";

function NotificationEmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Bell aria-hidden className="size-4" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t("notifications.emptyTitle")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("notifications.emptyDescription")}</p>
    </div>
  );
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const [isExpanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<NotificationRead | null>(null);
  const unread = useUnreadNotificationsCount();
  const badgeLabel = unread > 9 ? "9+" : String(unread);
  const { list } = useNotificationsList(isOpen, isExpanded);
  const { markAsRead, markAllAsRead } = useNotificationActions();

  const handleSelect = (item: NotificationRead) => {
    if (!item.is_read) markAsRead(item.id);
    setOpen(false);
    setSelected({ ...item, is_read: true });
  };
  const handleHeaderAction = () => {
    setExpanded((prev) => !prev);
    if (unread > 0) markAllAsRead();
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <Popover.Trigger
          aria-label={t("notifications.open")}
          className="inline-flex size-9 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-muted"
        >
          <Bell aria-hidden className="size-5" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {badgeLabel}
            </span>
          )}
        </Popover.Trigger>
        <Popover.Content>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              {t("notifications.title")}
            </span>
            <Button variant="link" size="xs" className="px-0" onClick={handleHeaderAction}>
              {isExpanded ? t("notifications.showLess") : t("notifications.viewAll")}
            </Button>
          </div>
          {list.status === "pending" && (
            <div className="space-y-3 p-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </div>
          )}
          {list.status === "success" &&
            (list.items.length === 0 ? (
              <NotificationEmptyState />
            ) : (
              <ul className="max-h-96 divide-y divide-border overflow-y-auto">
                {list.items.map((item) => (
                  <NotificationItem key={item.id} notification={item} onSelect={handleSelect} />
                ))}
              </ul>
            ))}
        </Popover.Content>
      </Popover>
      <NotificationDetailDialog notification={selected} onClose={() => setSelected(null)} />
    </>
  );
}
