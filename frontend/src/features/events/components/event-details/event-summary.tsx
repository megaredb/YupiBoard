import type { ReactNode } from "react";
import { Dices } from "lucide-react";
import type { EventRead } from "@/shared/api/generated/model";
import { EventFacts } from "@/features/events/components/event-details/event-facts";
import { EventHero } from "@/features/events/components/event-details/event-hero";

interface EventSummaryProps {
  event: EventRead;
  heroActions: ReactNode;
}

export function EventSummary({ event, heroActions }: EventSummaryProps) {
  return (
    <article className="overflow-hidden desktop:rounded-2xl desktop:border desktop:border-border desktop:bg-card">
      <EventHero photoUrl={event.photo_url} isPromoted={event.is_promoted} actions={heroActions} />
      <div className="space-y-5 px-4 pt-4 pb-6 desktop:px-6 desktop:pt-6 desktop:pb-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground desktop:text-3xl">
            {event.title}
          </h1>
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Dices aria-hidden className="size-4 shrink-0 text-primary" />
            <span>{event.game_title}</span>
          </p>
        </div>
        <div className="border-t border-border pt-5">
          <EventFacts event={event} />
        </div>
      </div>
    </article>
  );
}
