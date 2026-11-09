import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/page-container";
import { PageHeader } from "@/shared/layout/page-header";
import { EventList } from "@/features/events/components/event-list";
import { EventPagination } from "@/features/events/components/event-pagination";
import type { PagedEvents } from "@/features/events/lib/to-paged-events";

interface EventCollectionProps {
  title: string;
  aside?: ReactNode;
  events: PagedEvents;
  page: number;
  onPageChange: (page: number) => void;
  empty: { title: string; description: string };
  showOrganizer: boolean;
}

/** Layout shared by "My events", "My bookings" and "Favorites". */
export function EventCollection({
  title,
  aside,
  events,
  page,
  onPageChange,
  empty,
  showOrganizer,
}: EventCollectionProps) {
  const { t } = useTranslation();

  return (
    <PageContainer size="wide">
      <PageHeader title={title} aside={aside} />
      <div className="mt-6 space-y-6">
        {Boolean(events.total) && (
          <p className="text-sm font-semibold">
            {t("events.collection.found", { count: events.total ?? 0 })}
          </p>
        )}
        <EventList
          state={events.list}
          isRefreshing={events.isRefreshing}
          empty={empty}
          showOrganizer={showOrganizer}
        />
        <EventPagination
          page={page}
          total={events.total}
          totalPages={events.totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </PageContainer>
  );
}
