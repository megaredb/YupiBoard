import { Star, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventCardProps } from "../EventCard"

type EventCardMediaProps = Pick<
  EventCardProps,
  "title" | "imageUrl" | "status" | "organizer" | "participants" | "variant"
>

const participantsStyles = {
  default: "bg-amber-100 text-amber-800",
  purple: "bg-violet-100 text-primary",
} as const

export function EventCardMedia({
  title,
  imageUrl,
  status = null,
  organizer = null,
  participants,
  variant = "default",
}: EventCardMediaProps) {
  return (
    <div className="relative aspect-16/10 w-full shrink-0 overflow-hidden bg-linear-to-br from-purple-200 to-primary/70">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-linear-to-t to-transparent",
          organizer ? "from-black/60" : "from-black/35",
        )}
      />

      {status === "finished" && (
        <div className="absolute inset-x-0 top-0 z-10 bg-foreground py-1.5 text-center text-xs font-medium text-primary-foreground">
          Finished
        </div>
      )}

      {status === "promoted" && (
        <span className="absolute top-3 right-3 z-10 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          Promoted
        </span>
      )}

      {organizer && (
        <div className="absolute right-20 bottom-3 left-3 z-10 flex min-w-0 items-center gap-2">
          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card/90 text-xs font-semibold text-primary">
            {organizer.avatarUrl ? (
              <img
                src={organizer.avatarUrl}
                alt={organizer.name}
                className="size-full object-cover"
              />
            ) : (
              organizer.initials
            )}
          </span>

          <div className="min-w-0 text-primary-foreground">
            <p className="truncate text-xs leading-tight">{organizer.name}</p>
            <p className="flex items-center gap-1 text-[11px] leading-tight text-primary-foreground/90">
              <Star className="size-3 shrink-0 fill-amber-400 text-amber-400" />
              <span className="truncate">
                {organizer.rating} ({organizer.reviewsCount})
              </span>
            </p>
          </div>
        </div>
      )}

      <span
        aria-label={`${participants.current} of ${participants.max} participants`}
        className={cn(
          "absolute right-3 bottom-3 z-10 inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-medium",
          participantsStyles[variant],
        )}
      >
        {participants.current} / {participants.max}
        <Users className="size-3.5 fill-current" />
      </span>
    </div>
  )
}
