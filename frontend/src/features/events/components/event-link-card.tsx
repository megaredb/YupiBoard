import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { EventListItem } from "@/shared/api/generated/model";
import { formatCardDate } from "@/shared/lib/format/format-date";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { EventCard } from "@/features/events/components/event-card";
import { getEventPrice } from "@/features/events/lib/get-event-price";
import { formatRating } from "@/features/users";

interface EventLinkCardProps {
  event: EventListItem;
  showOrganizer: boolean;
}

/** Maps a catalog item to the presentational `EventCard`, wrapped in a link to the event. */
export function EventLinkCard({ event, showOrganizer }: EventLinkCardProps) {
  const { t } = useTranslation();
  const price = getEventPrice(event);
  const location =
    event.distance_km == null
      ? event.address
      : t("events.card.distance", { km: formatDecimal(event.distance_km) });

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: event.id }}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <EventCard
        className="transition-shadow group-hover:shadow-md"
        title={event.title}
        meta={{ date: formatCardDate(event.start_datetime), location }}
        price={{ isFree: price.isFree, label: price.isFree ? t("events.free") : price.formatted }}
        promotedLabel={event.is_promoted ? t("events.promoted") : null}
        participants={{
          current: event.current_confirmed,
          max: event.max_players,
          label: t("events.card.participants", {
            current: event.current_confirmed,
            max: event.max_players,
          }),
        }}
        organizer={
          showOrganizer
            ? {
                name: event.organizer.name,
                rating: formatRating(event.organizer.rating_as_organizer),
              }
            : null
        }
      />
    </Link>
  );
}
