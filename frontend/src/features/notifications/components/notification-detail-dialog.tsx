import { Link } from "@tanstack/react-router";
import { Dices } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead, NotificationRead } from "@/shared/api/generated/model";
import { formatCardDate } from "@/shared/lib/format/format-date";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { buttonVariants } from "@/shared/ui/button-variants";
import { Dialog } from "@/shared/ui/dialog";
import { useNotificationEvent } from "@/features/notifications/hooks/use-notifications";
import { getNotificationCopy } from "@/features/notifications/lib/get-notification-copy";
import { getNotificationEventId } from "@/features/notifications/lib/get-notification-event-id";

interface NotificationDetailDialogProps {
  notification: NotificationRead | null;
  onClose: () => void;
}

function NotificationEventPreview({ event }: { event: EventRead }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3">
      {event.photo_url ? (
        <img src={event.photo_url} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-image-placeholder text-primary">
          <Dices aria-hidden className="size-6" />
        </div>
      )}
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-semibold text-foreground">{event.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatCardDate(event.start_datetime)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {event.location_name ?? event.address}
        </p>
      </div>
    </div>
  );
}

export function NotificationDetailDialog({ notification, onClose }: NotificationDetailDialogProps) {
  const { t } = useTranslation();
  const eventId = notification ? getNotificationEventId(notification) : null;
  const event = useNotificationEvent(eventId);
  if (!notification) return null;

  const { title, message } = getNotificationCopy(notification, t);
  const entryCost = event ? Number(event.entry_cost) : null;
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <Dialog.Content closeLabel={t("common.close")}>
        <Dialog.Header>
          <Dialog.Title className="pr-8">{title}</Dialog.Title>
        </Dialog.Header>
        {event && <NotificationEventPreview event={event} />}
        <Dialog.Description className="leading-relaxed text-foreground/85">
          {message}
        </Dialog.Description>
        {entryCost !== null && (
          <div className="rounded-xl bg-muted/50 px-3.5 py-2.5 text-xs text-muted-foreground">
            {entryCost > 0
              ? t("notifications.entryFee", { amount: formatDecimal(entryCost) })
              : t("notifications.entryFree")}
          </div>
        )}
        {eventId && (
          <Link
            to="/events/$eventId"
            params={{ eventId }}
            onClick={onClose}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            {t("notifications.viewEvent")}
          </Link>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
