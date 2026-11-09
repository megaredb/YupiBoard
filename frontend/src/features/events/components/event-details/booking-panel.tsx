import { ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { Card } from "@/shared/ui/card";
import { SeatsProgress } from "@/shared/ui/seats-progress";
import { BookingButton } from "@/features/events/components/event-details/booking-button";
import { PriceLabel } from "@/features/events/components/event-details/price-label";
import type { BookingAction } from "@/features/events/hooks/use-booking-action";
import { getEventPrice } from "@/features/events/lib/get-event-price";

interface BookingPanelProps {
  event: EventRead;
  action: BookingAction;
}

/** Desktop sidebar card with price, seats and the booking call to action. */
export function BookingPanel({ event, action }: BookingPanelProps) {
  const { t } = useTranslation();
  const price = getEventPrice(event);

  return (
    <Card className="rounded-2xl p-6 shadow-sm">
      <Card.Content className="space-y-5 p-0">
        <div>
          <p className="text-sm font-medium text-foreground">{t("events.booking.title")}</p>
          <PriceLabel price={price} className="mt-2 text-4xl" />
          <p className="mt-1 text-xs text-muted-foreground">{t("events.booking.subtitle")}</p>
        </div>

        <div className="space-y-2.5 border-t border-border pt-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Users aria-hidden className="size-4" />
            <span>
              {t("events.booking.seatsAvailable", {
                left: event.available_seats,
                total: event.max_players,
              })}
            </span>
          </p>
          <SeatsProgress
            taken={event.current_confirmed}
            total={event.max_players}
            label={t("events.details.seatsProgress")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("events.booking.playersJoining", { count: event.current_confirmed })}</span>
            <span>{t("events.booking.seatsTotal", { count: event.max_players })}</span>
          </div>
        </div>

        <BookingButton action={action} className="w-full" />
        {action.hasFailed && (
          <p role="alert" className="text-center text-xs text-destructive">
            {t("events.booking.failed")}
          </p>
        )}

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>{t("events.booking.reviewNote")}</p>
          {!price.isFree && (
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck aria-hidden className="size-3.5" />
              <span>{t("events.booking.payAtVenue")}</span>
            </p>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
