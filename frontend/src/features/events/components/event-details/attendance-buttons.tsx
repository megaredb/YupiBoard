import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/shared/api/generated/model";
import { Button } from "@/shared/ui/button";
import { BookingStatusBadge } from "@/features/events/components/booking-status-badge";

interface AttendanceButtonsProps {
  status: BookingStatus;
  canMark: boolean;
  isPending: boolean;
  isDisabled: boolean;
  onMark: (attended: boolean) => void;
  /** Extra actions for a player who attended (rating). */
  attendedExtra?: ReactNode;
}

/** A confirmed player can be marked either way; a no-show can still be corrected, `Attended` is final. */
export function AttendanceButtons({
  status,
  canMark,
  isPending,
  isDisabled,
  onMark,
  attendedExtra,
}: AttendanceButtonsProps) {
  const { t } = useTranslation();
  const isMarkable = canMark && (status === "Confirmed" || status === "NoShow");
  const handlePresent = () => onMark(true);
  const handleAbsent = () => onMark(false);

  if (!isMarkable) {
    return (
      <>
        <BookingStatusBadge status={status} />
        {status === "Attended" && attendedExtra}
      </>
    );
  }

  return (
    <>
      {status === "NoShow" && <BookingStatusBadge status={status} />}
      <Button size="lg" isLoading={isPending} disabled={isDisabled} onClick={handlePresent}>
        {t("events.attendance.present")}
      </Button>
      {status === "Confirmed" && (
        <Button variant="secondary" size="lg" disabled={isDisabled} onClick={handleAbsent}>
          {t("events.attendance.absent")}
        </Button>
      )}
    </>
  );
}
