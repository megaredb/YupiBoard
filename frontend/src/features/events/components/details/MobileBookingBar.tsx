import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { formatPrice } from "../../lib/format"
import type { EventDetails } from "../../types"
import { useBookingAction } from "./useBookingAction"

export function MobileBookingBar({ event }: { event: EventDetails }) {
  const { t } = useTranslation()
  const action = useBookingAction(event)
  const isFree = event.price === 0
  const hasSeats = event.seatsTaken < event.seatsTotal

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
      <div className="min-w-0">
        <p className="text-xl font-semibold">
          {isFree ? t("events.free") : formatPrice(event.price, event.currency)}
          {!isFree && <span className="text-sm font-normal text-muted-foreground"> {t("events.booking.perPerson")}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {hasSeats ? t("events.booking.seatsAvailableShort") : t("events.booking.full")}
        </p>
      </div>
      <Button size="lg" className="h-11 flex-1 max-w-52" disabled={action.disabled} isLoading={action.isPending} onClick={action.onClick}>
        {action.label}
      </Button>
    </div>
  )
}
