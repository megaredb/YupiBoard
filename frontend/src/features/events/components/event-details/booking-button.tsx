import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { BOOKING_STATE_LABEL_KEYS } from "@/features/events/lib/booking-state-label-keys";

interface BookingButtonProps {
  action: BookingAction;
  className?: string;
}

/** "Apply", or the reason the player cannot apply (ORG-6). */
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
      {t(BOOKING_STATE_LABEL_KEYS[action.state])}
    </Button>
  );
}
