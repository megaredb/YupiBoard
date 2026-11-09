import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";

type BadgeVariant = "secondary" | "muted" | "success" | "warning";

const STATUS_DISPLAY = {
  Pending: { labelKey: "events.bookingStatus.pending", variant: "warning" },
  Confirmed: { labelKey: "events.bookingStatus.confirmed", variant: "success" },
  Waitlist: { labelKey: "events.bookingStatus.waitlist", variant: "secondary" },
  Rejected: { labelKey: "events.bookingStatus.rejected", variant: "muted" },
  CancelledByPlayer: { labelKey: "events.bookingStatus.cancelledByPlayer", variant: "muted" },
  CancelledBySystem: { labelKey: "events.bookingStatus.cancelledBySystem", variant: "muted" },
  RemovedByOrganizer: { labelKey: "events.bookingStatus.removedByOrganizer", variant: "muted" },
  Attended: { labelKey: "events.bookingStatus.attended", variant: "success" },
  NoShow: { labelKey: "events.bookingStatus.noShow", variant: "muted" },
} as const satisfies Record<BookingStatus, { labelKey: string; variant: BadgeVariant }>;

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation();
  const { labelKey, variant } = STATUS_DISPLAY[status];
  return <Badge variant={variant}>{t(labelKey)}</Badge>;
}
