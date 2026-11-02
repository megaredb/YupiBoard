import { PageContainer } from "@/shared/layout/page-container"
import { Skeleton } from "@/shared/ui/skeleton"

/** Router `defaultPendingComponent`: a neutral page skeleton. */
export function RoutePending() {
  return (
    <PageContainer>
      <div aria-busy className="space-y-4">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    </PageContainer>
  )
}
