import type { ReactNode } from "react"
import type { EventRead } from "@/shared/api/generated/model"
import { EventFacts } from "@/features/events/components/event-facts"
import { EventHero } from "@/features/events/components/event-hero"

interface EventSummaryProps {
  event: EventRead
  /** Share and favorite buttons shown on the hero image on desktop. */
  heroActions: ReactNode
}

/** Hero image, title and key facts of an event. */
export function EventSummary({ event, heroActions }: EventSummaryProps) {
  return (
    <article className="overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card">
      <EventHero photoUrl={event.photo_url} isPromoted={event.is_promoted} actions={heroActions} />
      <div className="space-y-5 px-4 pt-4 pb-6 lg:px-6 lg:pt-6 lg:pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {event.title}
        </h1>
        <div className="border-t border-border pt-5">
          <EventFacts event={event} />
        </div>
      </div>
    </article>
  )
}
