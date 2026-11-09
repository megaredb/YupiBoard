import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { Card } from "@/shared/ui/card";
import { HostBookingList } from "@/features/events/components/event-details/host-booking-list";
import { ParticipantList } from "@/features/events/components/event-details/participant-list";
import { PARTICIPANTS_SECTION_ID } from "@/features/events/lib/participants-section-id";

interface EventParticipantsSectionProps {
  event: EventRead;
  viewer: "host" | "participant";
}

/** "Participants (4/6 joined)": booking requests for the host, the table for its players. */
export function EventParticipantsSection({ event, viewer }: EventParticipantsSectionProps) {
  const { t } = useTranslation();
  const isHost = viewer === "host";
  const hint = isHost ? t("events.participants.hostHint") : t("events.participants.playerHint");

  return (
    <Card id={PARTICIPANTS_SECTION_ID} className="scroll-mt-20 rounded-2xl p-6 shadow-sm">
      <Card.Header className="gap-1 p-0">
        <Card.Title className="text-xl font-bold tracking-tight">
          {t("events.participants.title", {
            taken: event.current_confirmed,
            total: event.max_players,
          })}
        </Card.Title>
        <Card.Description>{hint}</Card.Description>
      </Card.Header>
      <Card.Content className="p-0">
        {isHost ? <HostBookingList eventId={event.id} /> : <ParticipantList eventId={event.id} />}
      </Card.Content>
    </Card>
  );
}
