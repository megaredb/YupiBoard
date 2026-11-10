import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { Card } from "@/shared/ui/card";
import { HostBookingList } from "@/features/events/components/event-details/host-booking-list";
import { ParticipantList } from "@/features/events/components/event-details/participant-list";
import { useEventBookings } from "@/features/events/hooks/use-event-bookings";
import { PARTICIPANTS_SECTION_ID } from "@/features/events/lib/participants-section-id";

interface EventParticipantsSectionProps {
  event: EventRead;
  viewer: "host" | "participant";
}

function HostPendingCard({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const pending = useEventBookings(eventId, 1, "Pending");

  return (
    <Card size="lg">
      <Card.Header>
        <Card.Description>
          {t("events.participants.pendingTitle", { count: pending.total ?? 0 })}
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <HostBookingList
          eventId={eventId}
          status="Pending"
          emptyText={t("events.participants.noRequests")}
        />
      </Card.Content>
    </Card>
  );
}

export function EventParticipantsSection({ event, viewer }: EventParticipantsSectionProps) {
  const { t } = useTranslation();
  const isHost = viewer === "host";

  return (
    <div id={PARTICIPANTS_SECTION_ID} className="scroll-mt-20 space-y-6">
      <Card size="lg">
        <Card.Header>
          <Card.Title size="xl">
            {t("events.participants.title", {
              taken: event.current_confirmed,
              total: event.max_players,
            })}
          </Card.Title>
          <Card.Description>
            {t("events.participants.confirmedTitle", { count: event.current_confirmed })}
          </Card.Description>
        </Card.Header>
        <Card.Content>
          {isHost ? (
            <HostBookingList
              eventId={event.id}
              status="Confirmed"
              emptyText={t("events.participants.noPlayers")}
            />
          ) : (
            <ParticipantList eventId={event.id} />
          )}
        </Card.Content>
      </Card>
      {isHost && <HostPendingCard eventId={event.id} />}
    </div>
  );
}
