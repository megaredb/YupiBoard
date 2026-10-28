import { ShieldCheck, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatPrice } from "../../lib/format"
import type { EventDetails } from "../../types"
import { SeatsProgress } from "../SeatsProgress"
import { useBookingAction } from "./useBookingAction"

/** Desktop sidebar: price, seats and the Apply button. */
export function BookingCard({ event }: { event: EventDetails }) {
  const { t } = useTranslation()
  const action = useBookingAction(event)
  const isFree = event.price === 0
  const seatsLeft = event.seatsTotal - event.seatsTaken

  return (
    <Card>
      <CardContent className="space-y-4 py-2">
        <p className="text-sm">{t("events.booking.title")}</p>

        <div>
          <p className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tracking-tight">
              {isFree ? t("events.free") : formatPrice(event.price, event.currency)}
            </span>
            {!isFree && <span className="text-sm text-muted-foreground">{t("events.booking.perPerson")}</span>}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{t("events.booking.priceNote")}</p>
        </div>

        <div className="space-y-2 border-t pt-4">
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <Users aria-hidden className="size-4" />
            {t("events.booking.seatsAvailable", { left: seatsLeft, total: event.seatsTotal })}
          </p>
          <SeatsProgress
            taken={event.seatsTaken}
            total={event.seatsTotal}
            label={t("events.details.seatsProgress")}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("events.booking.playersJoining", { count: event.seatsTaken })}</span>
            <span>{t("events.booking.seatsTotal", { count: event.seatsTotal })}</span>
          </div>
        </div>

        <Button size="lg" className="h-10 w-full" disabled={action.disabled} isLoading={action.isPending} onClick={action.onClick}>
          {action.label}
        </Button>

        {action.hasError && (
          <p role="alert" className="text-center text-xs text-destructive">
            {t("events.booking.failed")}
          </p>
        )}

        <div className="space-y-2 text-center text-xs text-muted-foreground">
          <p>{t("events.booking.reviewNote")}</p>
          {!isFree && (
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck aria-hidden className="size-3.5" />
              {t("events.booking.payAtVenue")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
