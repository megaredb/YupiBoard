import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/page-container";
import { PageHeader } from "@/shared/layout/page-header";
import { EventPagination } from "@/features/events/components/event-pagination";
import type { PagedList } from "@/features/events/lib/to-paged-list";

interface EventCollectionProps {
  title: string;
  aside?: ReactNode;
  toolbar?: ReactNode;
  results: Pick<PagedList<unknown>, "total" | "totalPages">;
  page: number;
  onPageChange: (page: number) => void;
  countLabelKey?: "events.collection.found" | "events.myBookings.found";
  children: ReactNode;
}

export function EventCollection({
  title,
  aside,
  toolbar,
  results,
  page,
  onPageChange,
  countLabelKey = "events.collection.found",
  children,
}: EventCollectionProps) {
  const { t } = useTranslation();
  const hasCount = Boolean(results.total);

  return (
    <PageContainer size="wide">
      <PageHeader title={title} aside={aside} />
      <div className="mt-6 space-y-6">
        {(hasCount || toolbar) && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">
              {hasCount && t(countLabelKey, { count: results.total ?? 0 })}
            </p>
            {toolbar && <div className="flex flex-col gap-3 sm:flex-row">{toolbar}</div>}
          </div>
        )}
        {children}
        <EventPagination
          page={page}
          total={results.total}
          totalPages={results.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </PageContainer>
  );
}
