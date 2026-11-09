import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { BookingFailure } from "@/features/events/hooks/use-booking-action";

const FAILURE_KEYS = {
  apply: "events.booking.failed",
  cancel: "events.booking.cancelFailed",
} as const satisfies Record<BookingFailure, string>;

interface BookingFailureMessageProps {
  failure: BookingFailure | null;
  className?: string;
}

export function BookingFailureMessage({ failure, className }: BookingFailureMessageProps) {
  const { t } = useTranslation();
  if (!failure) return null;

  return (
    <p role="alert" className={cn("text-center text-xs text-destructive", className)}>
      {t(FAILURE_KEYS[failure])}
    </p>
  );
}
