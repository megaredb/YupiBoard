import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatShortDateTime } from "@/shared/lib/format/format-date";
import { getHoursLeft } from "@/features/events/lib/get-hours-left";

interface AttendanceDeadlineProps {
  deadline: string;
  isOpen: boolean;
}

export function AttendanceDeadline({ deadline, isOpen }: AttendanceDeadlineProps) {
  const { t } = useTranslation();
  const date = formatShortDateTime(deadline);

  if (!isOpen) {
    return (
      <p className="text-sm text-muted-foreground">{t("events.attendance.closed", { date })}</p>
    );
  }

  return (
    <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-primary">
      <span>{t("events.attendance.changeUntil")}</span>
      <Calendar aria-hidden className="size-4" />
      <span>{date}</span>
      <span>{t("events.attendance.hoursLeft", { count: getHoursLeft(deadline) })}</span>
    </p>
  );
}
