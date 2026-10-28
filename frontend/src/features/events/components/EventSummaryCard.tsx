import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { getInitials } from "@/lib/format"
import { formatCardDate, formatKm, formatPrice } from "../lib/format"
import type { EventSummary } from "../types"
import { EventCard } from "./EventCard"

interface EventSummaryCardProps {
  event: EventSummary
  /** Show the organizer overlay (catalog, bookings). Hidden where the viewer is the organizer. */
  showOrganizer?: boolean
}

/** Domain adapter: turns an `EventSummary` into the presentational <EventCard> and links to the event page. */
export function EventSummaryCard({ event, showOrganizer = false }: EventSummaryCardProps) {
  const { t } = useTranslation()
  const isFree = event.price === 0
  const { organizer } = event

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <EventCard
        className="transition-shadow group-hover:shadow-md"
        title={event.title}
        imageUrl={event.coverImageUrl}
        date={formatCardDate(event.startsAt, event.timezone)}
        distance={
          event.distanceKm === null
            ? t("events.card.noDistance")
            : t("events.card.distance", { km: formatKm(event.distanceKm) })
        }
        price={isFree ? t("events.free") : formatPrice(event.price, event.currency)}
        isFree={isFree}
        status={event.status === "finished" ? "finished" : event.isPromoted ? "promoted" : null}
        participants={{ current: event.seatsTaken, max: event.seatsTotal }}
        // Design shows the purple badge on free events, amber on paid ones. Change here only.
        variant={isFree ? "purple" : "default"}
        organizer={
          showOrganizer
            ? {
                name: organizer.fullName,
                initials: getInitials(organizer.fullName),
                avatarUrl: organizer.avatarUrl,
                rating: organizer.rating.toFixed(1),
                reviewsCount: organizer.reviewsCount,
              }
            : null
        }
      />
    </Link>
  )
}
