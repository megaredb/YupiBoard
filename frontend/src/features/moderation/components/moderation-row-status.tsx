import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { formatShortDateTime } from "@/shared/lib/format/format-date";
import { Badge } from "@/shared/ui/badge";
import { buttonVariants } from "@/shared/ui/button-variants";
import type { ModerationTab } from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationRowStatusProps {
  event: Pick<EventRead, "updated_at" | "rejection_reason">;
  tab: ModerationTab;
}

/** Right side of a queue row: "Review" for waiting events, the outcome for decided ones. */
export function ModerationRowStatus({ event, tab }: ModerationRowStatusProps) {
  const { t } = useTranslation();

  if (tab === "pending") {
    return (
      <div className="flex shrink-0 items-center gap-3">
        <Badge variant="success">{t("moderation.autoCheck.passed")}</Badge>
        <span className={buttonVariants({ size: "lg", className: "px-4" })}>
          {t("moderation.row.review")}
        </span>
      </div>
    );
  }

  const isApproved = tab === "approved";

  return (
    <div className="flex shrink-0 flex-col gap-1.5 sm:max-w-64 sm:items-end sm:text-right">
      <p className="text-xs text-muted-foreground">
        {t("moderation.row.reviewed", { date: formatShortDateTime(event.updated_at) })}
      </p>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {isApproved && <Badge variant="muted">{t("moderation.autoCheck.passed")}</Badge>}
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
