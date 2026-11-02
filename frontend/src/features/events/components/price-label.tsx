import { useTranslation } from "react-i18next"
import { cn } from "@/shared/lib/cn"
import type { EventPrice } from "@/features/events/lib/get-event-price"

export function PriceLabel({ price, className }: { price: EventPrice; className?: string }) {
  const { t } = useTranslation()

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-bold tracking-tight text-foreground">
        {price.isFree ? t("events.free") : price.formatted}
      </span>
      {!price.isFree && (
        <span className="text-sm font-normal text-muted-foreground">
          {t("events.booking.perPerson")}
        </span>
      )}
    </div>
  )
}
