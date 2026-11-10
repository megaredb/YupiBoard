import { PageContainer } from "@/shared/layout/page-container";
import { Skeleton } from "@/shared/ui/skeleton";

export function EventDetailsSkeleton() {
  return (
    <PageContainer>
      <div aria-busy className="space-y-4 desktop:grid desktop:grid-with-aside desktop:gap-8">
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-2xl" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="hidden h-96 w-full rounded-2xl desktop:block" />
      </div>
    </PageContainer>
  );
}
