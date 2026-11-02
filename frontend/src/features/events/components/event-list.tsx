import { useTranslation } from "react-i18next"
import type { EventListItem } from "@/shared/api/generated/model"
import { cn } from "@/shared/lib/cn"
import type { ListState } from "@/shared/lib/list-state"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { StatusMessage } from "@/shared/ui/status-message"
import { EventLinkCard } from "@/features/events/components/event-link-card"

interface EventListProps {
  state: ListState<EventListItem>
  empty: { title: string; description: string }
  showOrganizer: boolean
  /** Dims the grid while the next page loads. */
  isRefreshing?: boolean
}

const GRID_CLASS = "grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4"
const SKELETON_COUNT = 6

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  )
}

/** Grid of event cards with loading, error, empty and data states (UI-7). */
export function EventList({ state, empty, showOrganizer, isRefreshing = false }: EventListProps) {
  const { t } = useTranslation()

  if (state.status === "error") {
    return (
      <StatusMessage
        title={t("common.loadFailed")}
        action={
          <Button variant="outline" onClick={state.retry}>
            {t("common.retry")}
          </Button>
        }
      />
    )
  }

  if (state.status === "pending") {
    return (
      <div aria-busy className={GRID_CLASS}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (state.items.length === 0) {
    return <StatusMessage title={empty.title} description={empty.description} />
  }

  return (
    <div className={cn(GRID_CLASS, "transition-opacity", isRefreshing && "opacity-60")}>
      {state.items.map((event) => (
        <EventLinkCard key={event.id} event={event} showOrganizer={showOrganizer} />
      ))}
    </div>
  )
}
