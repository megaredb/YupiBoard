import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { EventListItem } from "@/shared/api/generated/model";
import { formatCardDate } from "@/shared/lib/format/format-date";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { EventCard } from "@/features/events/components/event-card";
import { EventStatusBadge } from "@/features/events/components/event-status-badge";
import { FavoriteButton } from "@/features/events/components/favorite-button";
import { useFavoriteToggle } from "@/features/events/hooks/use-favorite-toggle";
import { getEventPrice } from "@/features/events/lib/get-event-price";
import { formatRating } from "@/features/users";

interface EventLinkCardProps {
  event: EventListItem;
  showOrganizer: boolean;
  showStatus: boolean;
}

const EVENT_LINK_CLASS =
  "group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function EventLinkCard({ event, showOrganizer, showStatus }: EventLinkCardProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavoriteToggle(event);
  const price = getEventPrice(event);
  const place = event.location_name || event.address;
  const location =
    event.distance_km == null
      ? place
      : t("events.card.placeWithDistance", { place, km: formatDecimal(event.distance_km) });
  const organizer = showOrganizer
    ? {
        name: event.organizer.name,
        avatarUrl: event.organizer.avatar_url ?? null,
        rating: formatRating(event.organizer.rating_as_organizer),
      }
    : null;
  const favoriteLabel = t(isFavorite ? "events.card.removeFavorite" : "events.card.addFavorite", {
    title: event.title,
  });

  return (
    <div className="relative h-full">
      <Link to="/events/$eventId" params={{ eventId: event.id }} className={EVENT_LINK_CLASS}>
        <EventCard
          className="transition-shadow group-hover:shadow-md"
          title={event.title}
          imageUrl={event.photo_url ?? null}
          meta={{ date: formatCardDate(event.start_datetime), location }}
          price={{ isFree: price.isFree, label: price.isFree ? t("events.free") : price.formatted }}
          labels={{
            promoted: event.is_promoted ? t("events.promoted") : null,
            status: showStatus && <EventStatusBadge status={event.status} />,
          }}
          participants={{
            current: event.current_confirmed,
            max: event.max_players,
            label: t("events.card.participants", {
              current: event.current_confirmed,
              max: event.max_players,
            }),
          }}
          organizer={organizer}
        />
      </Link>
      <FavoriteButton
        isFavorite={isFavorite}
        label={favoriteLabel}
        onToggle={toggleFavorite}
        className="absolute top-2 right-2 z-20"
      />
    </div>
  );
}
