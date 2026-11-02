import { useTranslation } from "react-i18next";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import type { BookingState } from "@/features/events/lib/get-booking-state";

const BOOKING_LABEL_KEYS = {
  open: "events.booking.apply",
  hosting: "events.booking.hosting",
  closed: "events.booking.closed",
  approved: "events.booking.approved",
  waitlist: "events.booking.waitlist",
  pending: "events.booking.pending",
  full: "events.booking.full",
} as const satisfies Record<BookingState, TranslationKey>;

interface BookingButtonProps {
  action: BookingAction;
  className?: string;
}

/** Translates the booking state into the call to action (ORG-6). */
export function BookingButton({ action, className }: BookingButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      size="xl"
      className={cn("shadow-sm", className)}
      disabled={action.state !== "open"}
      isLoading={action.isPending}
      onClick={action.apply}
    >
      {t(BOOKING_LABEL_KEYS[action.state])}
    </Button>
  );
}
