import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { BookingButton } from "@/features/events/components/event-details/booking-button";
import { CancelBookingButton } from "@/features/events/components/event-details/cancel-booking-button";
import { PlayersLink } from "@/features/events/components/event-details/players-link";
import { PriceLabel } from "@/features/events/components/event-details/price-label";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { BOOKING_STATE_LABEL_KEYS } from "@/features/events/lib/booking-state-label-keys";
import { getEventPrice } from "@/features/events/lib/get-event-price";

interface MobileBookingBarProps {
  event: EventRead;
  action: BookingAction;
}

const ACTION_CLASS = "min-w-0 flex-1 text-center text-sm leading-tight whitespace-normal";

function MobileCallToAction({ event, action }: MobileBookingBarProps) {
  if (action.state === "hosting")
    return <PlayersLink eventId={event.id} className={ACTION_CLASS} />;
  if (action.canCancel) return <CancelBookingButton action={action} className={ACTION_CLASS} />;
  return <BookingButton action={action} className={ACTION_CLASS} />;
}

export function MobileBookingBar({ event, action }: MobileBookingBarProps) {
  const { t } = useTranslation();
  const seatsLabel =
    event.available_seats > 0 ? t("events.booking.seatsAvailableShort") : t("events.booking.full");

  return (
    <div className="fixed inset-x-0 bottom-(--keyboard-inset) z-40 border-t border-border bg-background/95 backdrop-blur-md lg:hidden">
      <div className="px-5 pt-3 pb-safe">
        <div className="flex items-center justify-between gap-4 pb-3">
          <div className="min-w-0">
            <PriceLabel price={getEventPrice(event)} className="text-xl" />
            <p className="truncate text-xs text-muted-foreground">
              {action.canCancel ? t(BOOKING_STATE_LABEL_KEYS[action.state]) : seatsLabel}
            </p>
          </div>
          <MobileCallToAction event={event} action={action} />
        </div>
      </div>
    </div>
  );
}
