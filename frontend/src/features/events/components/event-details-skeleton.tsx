import { PageContainer } from "@/shared/layout/page-container"
import { Skeleton } from "@/shared/ui/skeleton"

/** Pending state of `/events/$eventId`, shaped like the loaded page. */
export function EventDetailsSkeleton() {
  return (
    <PageContainer>
      <div aria-busy className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="hidden h-96 w-full rounded-2xl lg:block" />
      </div>
    </PageContainer>
  )
}
