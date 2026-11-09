import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/shared/ui/button-variants";
import { EventCollection } from "@/features/events/components/event-collection";
import { useMyCreatedEvents } from "@/features/events/hooks/use-my-created-events";

const route = getRouteApi("/_authenticated/my-events");

export function MyEventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page } = route.useSearch();
  const events = useMyCreatedEvents(page);
  const handlePageChange = (next: number) =>
    void navigate({ to: "/my-events", search: { page: next } });

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
      events={events}
      page={page}
      onPageChange={handlePageChange}
      empty={{
        title: t("events.myEvents.emptyTitle"),
        description: t("events.myEvents.emptyDescription"),
      }}
      showOrganizer={false}
    />
  );
}
