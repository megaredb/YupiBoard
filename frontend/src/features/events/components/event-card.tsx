import type { ReactNode } from "react";
import { Calendar, MapPin, Star } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
import { SeatAvailabilityBadge } from "@/shared/ui/seat-availability-badge";
import { UserAvatar } from "@/features/users";

interface EventCardOrganizer {
  name: string;
  avatarUrl: string | null;
  rating: string | null;
  ratingCount: number;
}

interface EventCardProps {
  title: string;
  imageUrl: string | null;
  meta: { date: string; location: string };
  price: { label: string; isFree: boolean };
  labels: { promoted: string | null; status?: ReactNode };
  /** Omitted when the source has no seat counts (booking summaries). */
  participants: { current: number; max: number; label: string } | null;
  organizer: EventCardOrganizer | null;
  className?: string;
}

export function EventCard({
  title,
  imageUrl,
  meta,
  price,
  labels,
  participants,
  organizer,
  className,
}: EventCardProps) {
  return (
    <Card className={cn("h-full gap-0 rounded-xl py-0", className)}>
      <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-linear-to-br from-image-placeholder to-primary/70">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            width={640}
            height={400}
            loading="lazy"
            className="absolute inset-0 size-full object-cover"
          />
        )}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-linear-to-t from-overlay/50 to-transparent"
        />
        {labels.promoted && (
          <span className="absolute top-3 left-3 z-10 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
            {labels.promoted}
          </span>
        )}
        {organizer && <CardOrganizer organizer={organizer} />}
        {participants && (
          <SeatAvailabilityBadge
            current={participants.current}
            max={participants.max}
            label={participants.label}
            className="absolute right-3 bottom-3 z-10"
          />
        )}
      </div>

      <Card.Content className="flex flex-1 flex-col gap-2 px-3 py-3">
        {labels.status && <div className="flex">{labels.status}</div>}
        <h3 className="line-clamp-2 text-base leading-snug font-normal">{title}</h3>
        <div className="mt-auto flex items-start justify-between gap-3">
          <ul className="min-w-0 space-y-1 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <MapPin aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{meta.location}</span>
            </li>
            <li className="flex items-center gap-2">
              <Calendar aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">{meta.date}</span>
            </li>
          </ul>
          <span
            className={cn(
              "shrink-0 text-sm font-semibold",
              price.isFree ? "text-primary" : "text-foreground",
            )}
          >
            {price.label}
          </span>
        </div>
      </Card.Content>
    </Card>
  );
}

function CardOrganizer({ organizer }: { organizer: EventCardOrganizer }) {
  return (
    <div className="absolute right-20 bottom-3 left-3 z-10 flex min-w-0 items-center gap-2">
      <UserAvatar
        name={organizer.name}
        avatarUrl={organizer.avatarUrl}
        className="size-8 border-0 text-xs"
      />
      <div className="min-w-0 text-primary-foreground">
        <p className="truncate text-xs leading-tight">{organizer.name}</p>
        {organizer.rating && (
          <p className="flex items-center gap-1 text-xs leading-tight">
            <Star aria-hidden className="size-3 shrink-0 fill-rating text-rating" />
            <span className="truncate">{`${organizer.rating} (${organizer.ratingCount})`}</span>
          </p>
        )}
      </div>
    </div>
  );
}
