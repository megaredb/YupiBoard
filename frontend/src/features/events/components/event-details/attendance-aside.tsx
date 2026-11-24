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

export function AttendanceAside({
  status,
  canMark,
  isPending,
  isDisabled,
  onMark,
  rating,
}: AttendanceAsideProps) {
  const { t } = useTranslation();

  if (status === "Attended") {
    return (
      <>
        <span className={STATUS_TEXT_CLASS}>{t("events.attendance.present")}</span>
        {rating}
      </>
    );
  }

  const isAbsent = status === "NoShow";
  const statusLabel = isAbsent ? t("events.attendance.absent") : t("events.attendance.notMarked");
  const trigger = isAbsent ? (
    <Button variant="ghost" size="lg" isLoading={isPending} disabled={isDisabled}>
      {t("events.attendance.absent")}
    </Button>
  ) : (
    <Button size="lg" isLoading={isPending} disabled={isDisabled}>
      {t("events.attendance.mark")}
    </Button>
  );

  return (
    <>
      {canMark ? (
        <AttendancePopover trigger={trigger} canMarkAbsent={!isAbsent} onMark={onMark} />
      ) : (
        <span className={STATUS_TEXT_CLASS}>{statusLabel}</span>
      )}
      {rating}
    </>
  );
}
