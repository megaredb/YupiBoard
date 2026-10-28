import type { ReactNode } from "react"
import { Calendar, MapPin, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { formatKm, formatLongDate, formatTimeRange } from "../../lib/format"
import type { EventDetails } from "../../types"
import { SeatsProgress } from "../SeatsProgress"

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0 space-y-0.5 text-sm">{children}</div>
    </div>
  )
}

export function EventFacts({ event }: { event: EventDetails }) {
  const { t } = useTranslation()
  const { venue } = event
  const distance =
    event.distanceKm === null ? null : t("events.card.distance", { km: formatKm(event.distanceKm) })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Fact icon={<Calendar />}>
          <p className="font-medium">{formatLongDate(event.startsAt, event.timezone)}</p>
          <p className="text-muted-foreground">
            {formatTimeRange(event.startsAt, event.endsAt, event.timezone)}
          </p>
        </Fact>

        <Fact icon={<MapPin />}>
          {venue.name &&
            (venue.mapUrl ? (
              <a
                href={venue.mapUrl}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs font-medium text-primary hover:underline"
              >
                {venue.name} ↗
              </a>
            ) : (
              <p className="truncate text-xs font-medium">{venue.name}</p>
            ))}
          <p className="text-muted-foreground">
            {[venue.address, distance].filter(Boolean).join(" · ")}
          </p>
        </Fact>
      </div>

      <div className="space-y-2 rounded-xl bg-muted p-3 lg:hidden">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Users aria-hidden className="size-4" />
          {t("events.details.playersJoined", { taken: event.seatsTaken, total: event.seatsTotal })}
        </p>
        <SeatsProgress
          taken={event.seatsTaken}
          total={event.seatsTotal}
          label={t("events.details.seatsProgress")}
        />
      </div>
    </div>
  )
}
