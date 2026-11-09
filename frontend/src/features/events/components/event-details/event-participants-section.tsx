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

export function EventParticipantsSection({ event, viewer }: EventParticipantsSectionProps) {
  const { t } = useTranslation();
  const isHost = viewer === "host";
  const hint = isHost ? t("events.participants.hostHint") : t("events.participants.playerHint");

  return (
    <Card id={PARTICIPANTS_SECTION_ID} size="lg" className="scroll-mt-20">
      <Card.Header>
        <Card.Title size="xl">
          {t("events.participants.title", {
            taken: event.current_confirmed,
            total: event.max_players,
          })}
        </Card.Title>
        <Card.Description>{hint}</Card.Description>
      </Card.Header>
      <Card.Content>
        {isHost ? <HostBookingList eventId={event.id} /> : <ParticipantList eventId={event.id} />}
      </Card.Content>
    </Card>
  );
}
