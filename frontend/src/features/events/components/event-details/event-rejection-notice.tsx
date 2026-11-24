import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";

interface EventRejectionNoticeProps {
  event: Pick<EventRead, "status" | "rejection_reason">;
}

/** Tells the organizer why moderation turned the event down (the API hides the reason from others). */
export function EventRejectionNotice({ event }: EventRejectionNoticeProps) {
  const { t } = useTranslation();
  if (event.status !== "Rejected") return null;

  return (
    <output className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
      <TriangleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="font-semibold text-destructive">{t("events.rejectionNotice.title")}</p>
        <p className="text-muted-foreground">
          {event.rejection_reason
            ? t("events.rejectionNotice.reason", { reason: event.rejection_reason })
            : t("events.rejectionNotice.noReason")}
        </p>
      </div>
    </output>
  );
}
