import { useTranslation } from "react-i18next";
import { HostBookingList } from "@/features/events/components/event-details/host-booking-list";
import { useEventBookings } from "@/features/events/hooks/use-event-bookings";

export function HostWaitlist({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { total } = useEventBookings(eventId, 1, "Waitlist");
  if (!total) return null;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">
          {t("events.participants.waitlistTitle", { count: total })}
        </h3>
        <p className="text-xs text-muted-foreground">{t("events.participants.waitlistHint")}</p>
      </div>
      <HostBookingList
        eventId={eventId}
        status="Waitlist"
        emptyText={t("events.participants.noPlayers")}
      />
    </section>
  );
}
