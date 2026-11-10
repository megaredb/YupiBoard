import { useTranslation } from "react-i18next";
import type { EventStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";
import { EVENT_STATUS_LABEL_KEYS } from "@/features/events/lib/event-status-label-keys";

type BadgeVariant = "secondary" | "muted" | "success" | "warning" | "destructive";

const STATUS_VARIANTS = {
  OnModeration: "warning",
  Rejected: "destructive",
  Published: "success",
  Ongoing: "secondary",
  Completed: "muted",
  Cancelled: "muted",
} as const satisfies Record<EventStatus, BadgeVariant>;

export function EventStatusBadge({ status }: { status: EventStatus }) {
  const { t } = useTranslation();
  return <Badge variant={STATUS_VARIANTS[status]}>{t(EVENT_STATUS_LABEL_KEYS[status])}</Badge>;
}
