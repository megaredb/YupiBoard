import { useTranslation } from "react-i18next";
import { BookingList } from "@/features/events/components/booking-list";
import { EventCollection } from "@/features/events/components/event-collection";
import { PersonalListSortSelect } from "@/features/events/components/personal-list-sort-select";
import { useMyBookings } from "@/features/events/hooks/use-my-bookings";
import { useMyBookingsSearch } from "@/features/events/hooks/use-my-bookings-search";

const SORT_LABEL_KEYS = {
  "date-desc": "events.myBookings.sortNewest",
  "date-asc": "events.myBookings.sortOldest",
  "name-asc": "events.sort.nameAsc",
  "name-desc": "events.sort.nameDesc",
} as const;

export function MyBookingsPage() {
  const { t } = useTranslation();
  const { search, applySort, goToPage } = useMyBookingsSearch();
  const bookings = useMyBookings(search);

  return (
    <EventCollection
      title={t("events.myBookings.title")}
      toolbar={
        <PersonalListSortSelect
          value={search.sort}
          labelKeys={SORT_LABEL_KEYS}
          onChange={applySort}
        />
      }
      results={bookings}
      page={search.page}
      onPageChange={goToPage}
      countLabelKey="events.myBookings.found"
    >
      <BookingList
        state={bookings.list}
        isRefreshing={bookings.isRefreshing}
        empty={{
          title: t("events.myBookings.emptyTitle"),
          description: t("events.myBookings.emptyDescription"),
        }}
      />
    </EventCollection>
  );
}
