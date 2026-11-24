import { useTranslation } from "react-i18next";
import type { ModerationEventRead } from "@/shared/api/generated/model";
import { formatShortDate } from "@/shared/lib/format/format-date";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button-variants";
import { AutoCheckBadge } from "@/features/moderation/components/auto-check-badge";
import type { ModerationTab } from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationRowStatusProps {
  event: Pick<
    ModerationEventRead,
    "auto_check_status" | "moderated_at" | "moderator_name" | "updated_at" | "rejection_reason"
  >;
  tab: ModerationTab;
}

function ReviewedLine({ event }: Pick<ModerationRowStatusProps, "event">) {
  const { t } = useTranslation();
  // Decisions made before the moderator was stored fall back to the last change of the event.
  const date = formatShortDate(event.moderated_at ?? event.updated_at);
  return (
    <p className="text-xs text-muted-foreground">
      {event.moderator_name
        ? t("moderation.row.reviewedBy", { date, name: event.moderator_name })
        : t("moderation.row.reviewed", { date })}
    </p>
  );
}

/** Right side of a queue row: "Review" for waiting events, the outcome for decided ones. */
export function ModerationRowStatus({ event, tab }: ModerationRowStatusProps) {
  const { t } = useTranslation();

  if (tab === "pending") {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <AutoCheckBadge status={event.auto_check_status} />
        <span className={buttonVariants({ size: "lg", className: "px-4" })}>
          {t("moderation.row.review")}
        </span>
      </div>
    );
  }

  const isApproved = tab === "approved";

  return (
    <div className="flex shrink-0 flex-col gap-1.5 sm:max-w-64 sm:items-end sm:text-right">
      <ReviewedLine event={event} />
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <AutoCheckBadge status={event.auto_check_status} isMuted />
        <Badge variant={isApproved ? "success" : "destructive"}>
          {t(isApproved ? "moderation.row.approved" : "moderation.row.rejected")}
        </Badge>
      </div>
      {!isApproved && event.rejection_reason && (
        <p className="line-clamp-2 text-xs text-destructive">
          {t("moderation.row.reason", { reason: event.rejection_reason })}
        </p>
      )}
    </div>
  );
}
