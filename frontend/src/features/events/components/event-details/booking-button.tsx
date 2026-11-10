import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { BOOKING_STATE_LABEL_KEYS } from "@/features/events/lib/booking-state-label-keys";

interface BookingButtonProps {
  action: BookingAction;
  className?: string;
}

export function BookingButton({ action, className }: BookingButtonProps) {
  const { t } = useTranslation();
  const labelKey =
    action.state === "rejected" && action.canApply
      ? "events.booking.reapply"
      : BOOKING_STATE_LABEL_KEYS[action.state];

  return (
    <Button
      size="xl"
      className={cn("text-sm shadow-sm", className)}
      disabled={!action.canApply}
      isLoading={action.isPending}
      onClick={action.apply}
    >
      {t(labelKey)}
    </Button>
  );
}
