import { Calendar, MapPin } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { EventCardProps } from "../EventCard"

type EventCardDetailsProps = Pick<
  EventCardProps,
  "title" | "distance" | "date" | "price" | "isFree" | "status"
>

export function EventCardDetails({
  title,
  distance,
  date,
  price,
  isFree = false,
  status = null,
}: EventCardDetailsProps) {
  return (
    <CardContent className="flex flex-1 flex-col gap-2 px-3 py-3">
      <h3 className="line-clamp-2 text-base leading-snug font-normal">{title}</h3>

      <div className="mt-auto flex items-start justify-between gap-3">
        <ul className="min-w-0 space-y-1 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{distance}</span>
          </li>
          <li className="flex items-center gap-2">
            <Calendar className="size-3.5 shrink-0" />
            <span className="truncate">{date}</span>
          </li>
        </ul>

        <span
          className={cn(
            "shrink-0 text-sm font-semibold",
            isFree
              ? "text-primary"
              : status === "finished"
                ? "text-muted-foreground"
                : "text-foreground",
          )}
        >
          {price}
        </span>
      </div>
    </CardContent>
  )
}
