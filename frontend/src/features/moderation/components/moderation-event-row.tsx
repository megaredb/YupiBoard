import { Link } from "@tanstack/react-router";
import { Calendar, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { formatCardDate } from "@/shared/lib/format/format-date";
import { formatRelativeTime } from "@/shared/lib/format/format-relative-time";
import { ModerationRowStatus } from "@/features/moderation/components/moderation-row-status";
import type { ModerationTab } from "@/features/moderation/schemas/moderation-search.schema";
import { formatRating, UserAvatar } from "@/features/users";

interface ModerationEventRowProps {
  event: EventRead;
  tab: ModerationTab;
}

function RowThumbnail({ event }: { event: Pick<EventRead, "photo_url" | "is_promoted"> }) {
  const { t } = useTranslation();

  return (
    <div className="relative h-40 shrink-0 overflow-hidden bg-linear-to-br from-image-placeholder to-primary/70 sm:h-auto sm:w-28">
      {event.photo_url && (
        <img
          src={event.photo_url}
          alt=""
          width={224}
          height={160}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {event.is_promoted && (
        <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {t("events.promoted")}
        </span>
      )}
    </div>
  );
}

export function ModerationEventRow({ event, tab }: ModerationEventRowProps) {
  const { t } = useTranslation();
  const rating = formatRating(event.organizer.rating_as_organizer);

  return (
    <li>
      <Link
        to="/events/$eventId"
        params={{ eventId: event.id }}
        className="flex flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 transition-shadow outline-none hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row"
      >
        <RowThumbnail event={event} />
        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h2 className="text-base leading-snug font-semibold">{event.title}</h2>
              <span className="text-xs text-muted-foreground">
                {t("admin.moderation.row.created", {
                  time: formatRelativeTime(event.created_at),
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserAvatar
                name={event.organizer.name}
                avatarUrl={event.organizer.avatar_url}
                className="size-5 border-0"
                fallbackClassName="text-[10px]"
              />
              <span className="truncate">{event.organizer.name}</span>
              {rating && (
                <span className="flex items-center gap-1">
                  <Star aria-hidden className="size-3 fill-rating text-rating" />
                  {rating}
                </span>
              )}
            </div>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar aria-hidden className="size-3.5 shrink-0" />
              {formatCardDate(event.start_datetime)}
            </p>
          </div>
          <ModerationRowStatus event={event} tab={tab} />
        </div>
      </Link>
    </li>
  );
}
