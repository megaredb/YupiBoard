import type { ComponentProps } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { EventCardDetails } from "./event-card/EventCardDetails"
import { EventCardMedia } from "./event-card/EventCardMedia"

export interface EventOrganizer {
  name: string
  initials?: string
  avatarUrl?: string | null
  rating: string
  reviewsCount: number
}

export interface EventCardProps
  extends Omit<ComponentProps<'div'>, 'title' | 'children'> {
  title: string
  imageUrl?: string | null
  date: string
  distance: string
  price: string
  isFree?: boolean
  status?: "finished" | "promoted" | null
  organizer?: EventOrganizer | null
  participants: {
    current: number
    max: number
  }
  variant?: "default" | "purple"
}

export function EventCard({
  title,
  imageUrl,
  date,
  distance,
  price,
  isFree = false,
  status = null,
  organizer = null,
  participants,
  variant = 'default',
  className,
  ...props
}: EventCardProps) {
  return (
    <Card
      className={cn("h-full gap-0 overflow-hidden rounded-xl py-0 shadow-sm", className)}
      {...props}
    >
      <EventCardMedia
        title={title}
        imageUrl={imageUrl}
        status={status}
        organizer={organizer}
        participants={participants}
        variant={variant}
      />
      <EventCardDetails
        title={title}
        distance={distance}
        date={date}
        price={price}
        isFree={isFree}
        status={status}
      />
    </Card>
  )
}