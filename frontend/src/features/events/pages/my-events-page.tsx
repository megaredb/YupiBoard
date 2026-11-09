import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventStatus } from "@/shared/api/generated/model";
import { buttonVariants } from "@/shared/ui/button-variants";
import { EventCollection } from "@/features/events/components/event-collection";
import { EventList } from "@/features/events/components/event-list";
import { EventStatusSelect } from "@/features/events/components/event-status-select";
import { PersonalListSortSelect } from "@/features/events/components/personal-list-sort-select";
import { useMyCreatedEvents } from "@/features/events/hooks/use-my-created-events";
import { useMyEventsSearch } from "@/features/events/hooks/use-my-events-search";
import type { PersonalListSort } from "@/features/events/schemas/personal-list-search.schema";

const SORT_LABEL_KEYS = {
  "date-desc": "events.sort.dateDesc",
  "date-asc": "events.sort.dateAsc",
  "name-asc": "events.sort.nameAsc",
  "name-desc": "events.sort.nameDesc",
} as const;

export function MyEventsPage() {
  const { t } = useTranslation();
  const { search, applySearch, goToPage } = useMyEventsSearch();
  const events = useMyCreatedEvents(search);

  const handleStatusChange = (status: EventStatus | undefined) => applySearch({ status });
  const handleSortChange = (sort: PersonalListSort) => applySearch({ sort });
  const empty = search.status
    ? {
        title: t("events.myEvents.noMatchTitle"),
        description: t("events.myEvents.noMatchDescription"),
      }
    : {
        title: t("events.myEvents.emptyTitle"),
        description: t("events.myEvents.emptyDescription"),
      };

  return (
    <EventCollection
      title={t("events.myEvents.title")}
      aside={
        <Link
          to="/events/new"
          className={buttonVariants({ size: "xl", className: "desktop:hidden" })}
        >
          <Plus aria-hidden />
          {t("shell.createEvent")}
        </Link>
      }
      toolbar={
        <>
          <EventStatusSelect value={search.status} onChange={handleStatusChange} />
          <PersonalListSortSelect
            value={search.sort}
            labelKeys={SORT_LABEL_KEYS}
            onChange={handleSortChange}
          />
        </>
      }
      results={events}
      page={search.page}
      onPageChange={goToPage}
    >
      <EventList
        state={events.list}
        isRefreshing={events.isRefreshing}
        empty={empty}
        showOrganizer={false}
        showStatus
      />
    </EventCollection>
  );
}
