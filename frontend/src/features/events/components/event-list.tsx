import type { EventListItem } from "@/shared/api/generated/model";
import type { ListState } from "@/shared/lib/list-state";
import { EventCardGrid } from "@/features/events/components/event-card-grid";
import { EventLinkCard } from "@/features/events/components/event-link-card";

interface EventListProps {
  state: ListState<EventListItem>;
  empty: { title: string; description: string };
  showOrganizer: boolean;
  showStatus?: boolean;
  isRefreshing?: boolean;
}

export function EventList({
  state,
  empty,
  showOrganizer,
  showStatus = false,
  isRefreshing = false,
}: EventListProps) {
  const renderCard = (event: EventListItem) => (
    <EventLinkCard
      key={event.id}
      event={event}
      showOrganizer={showOrganizer}
      showStatus={showStatus}
    />
  );

  return (
    <EventCardGrid
      state={state}
      empty={empty}
      isRefreshing={isRefreshing}
      renderCard={renderCard}
    />
  );
}
