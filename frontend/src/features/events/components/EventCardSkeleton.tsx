import { Skeleton } from "@/components/ui/skeleton"

/** Loading placeholder with the same footprint as <EventCard>. */
export function EventCardSkeleton() {
  return (
    <div aria-hidden className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  )
}
