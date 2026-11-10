import { Check, CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NotificationRead } from "@/shared/api/generated/model";
import { cn } from "@/shared/lib/cn";
import { formatShortDateTime } from "@/shared/lib/format/format-date";
import { getNotificationCopy } from "@/features/notifications/lib/get-notification-copy";

interface NotificationItemProps {
  notification: NotificationRead;
  onSelect: (notification: NotificationRead) => void;
}

export function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const { t } = useTranslation();
  const { title, message } = getNotificationCopy(notification, t);
  const handleClick = () => onSelect(notification);

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors outline-none hover:bg-muted/60 focus-visible:bg-muted/60",
          !notification.is_read && "bg-primary/3",
        )}
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-semibold text-foreground">{title}</span>
            <span className="shrink-0 text-[11px] text-muted-foreground">
              {formatShortDateTime(notification.created_at)}
            </span>
          </div>
          <p className="truncate text-xs text-muted-foreground">{message}</p>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {notification.is_read ? (
            <CheckCheck aria-hidden className="size-4 text-success" />
          ) : (
            <Check aria-hidden className="size-4" />
          )}
        </span>
      </button>
    </li>
  );
}
