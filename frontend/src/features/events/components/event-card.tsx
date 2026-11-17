import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { Calendar, MapPin, Star, Users } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/shared/ui/card";
import { UserAvatar } from "@/features/users";

interface EventCardOrganizer {
  name: string;
  avatarUrl: string | null;
  rating: string | null;
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

const LOW_SEATS_THRESHOLD = 0.3;

type SeatsAvailability = "default" | "low" | "full";

const participantsVariants = cva(
  "absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      availability: {
        default: "bg-muted text-primary",
        low: "bg-secondary text-secondary-foreground",
        full: "bg-secondary-deep text-secondary-foreground",
      },
    },
  },
);

function getSeatsAvailability(current: number, max: number): SeatsAvailability {
  if (max <= 0) return "default";
  const remaining = Math.max(0, max - current);
  if (remaining === 0) return "full";
  return remaining / max < LOW_SEATS_THRESHOLD ? "low" : "default";
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
        {participants && <CardParticipants participants={participants} />}
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

function CardParticipants({
  participants,
}: {
  participants: NonNullable<EventCardProps["participants"]>;
}) {
  const availability = getSeatsAvailability(participants.current, participants.max);

  return (
    <span aria-label={participants.label} className={participantsVariants({ availability })}>
      <span aria-hidden>{`${participants.current} / ${participants.max}`}</span>
      <Users aria-hidden className="size-3.5 fill-current" />
    </span>
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
            <span className="truncate">{organizer.rating}</span>
          </p>
        )}
      </div>
    </div>
  );
}
