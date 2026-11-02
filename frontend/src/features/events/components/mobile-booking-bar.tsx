import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { BookingButton } from "@/features/events/components/booking-button";
import { PriceLabel } from "@/features/events/components/price-label";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { getEventPrice } from "@/features/events/lib/get-event-price";

interface MobileBookingBarProps {
  event: EventRead;
  action: BookingAction;
}

export function MobileBookingBar({ event, action }: MobileBookingBarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-x-0 bottom-(--keyboard-inset) z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="px-5 pt-3 pb-safe">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="min-w-0">
            <PriceLabel price={getEventPrice(event)} className="text-xl" />
            <p className="text-xs text-muted-foreground">
              {event.available_seats > 0
                ? t("events.booking.seatsAvailableShort")
                : t("events.booking.full")}
            </p>
          </div>
          <BookingButton
            action={action}
            className="min-w-0 flex-1 text-center text-sm leading-tight whitespace-normal"
          />
        </div>
        {action.hasFailed && (
          <p role="alert" className="pb-2 text-center text-xs text-destructive">
            {t("events.booking.failed")}
          </p>
        )}
      </div>
    </div>
  );
}
