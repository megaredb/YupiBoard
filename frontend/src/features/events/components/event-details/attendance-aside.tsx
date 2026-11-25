import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/shared/api/generated/model";
import { Button } from "@/shared/ui/button";
import { AttendancePopover } from "@/features/events/components/event-details/attendance-popover";

interface AttendanceAsideProps {
  status: BookingStatus;
  canMark: boolean;
  isPending: boolean;
  isDisabled: boolean;
  onMark: (attended: boolean) => void;
  rating: ReactNode;
}

const STATUS_TEXT_CLASS = "min-w-24 text-center text-sm font-semibold text-foreground";

const MARKS: Partial<Record<BookingStatus, "present" | "absent">> = {
  Attended: "present",
  NoShow: "absent",
};

const MARK_LABEL_KEYS = {
  present: "events.attendance.present",
  absent: "events.attendance.absent",
} as const;

export function AttendanceAside({
  status,
  canMark,
  isPending,
  isDisabled,
  onMark,
  rating,
}: AttendanceAsideProps) {
  const { t } = useTranslation();
  const mark = MARKS[status] ?? null;
  const statusLabel = mark ? t(MARK_LABEL_KEYS[mark]) : t("events.attendance.notMarked");
  const trigger = mark ? (
    <Button variant="ghost" size="lg" isLoading={isPending} disabled={isDisabled}>
      {statusLabel}
    </Button>
  ) : (
    <Button size="lg" isLoading={isPending} disabled={isDisabled}>
      {t("events.attendance.mark")}
    </Button>
  );

  return (
    <>
      {canMark ? (
        <AttendancePopover trigger={trigger} mark={mark} onMark={onMark} />
      ) : (
        <span className={STATUS_TEXT_CLASS}>{statusLabel}</span>
      )}
      {rating}
    </>
  );
}
