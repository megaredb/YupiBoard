import { useTranslation } from "react-i18next";
import type { BookingParticipantSummary } from "@/shared/api/generated/model";
import { ParticipantListState } from "@/features/events/components/event-details/participant-list-state";
import { ParticipantRow } from "@/features/events/components/event-details/participant-row";
import { useEventParticipants } from "@/features/events/hooks/use-event-participants";

export function ParticipantList({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const participants = useEventParticipants(eventId);
  const confirmedAside = (
    <span className="text-xs font-semibold text-foreground">
      {t("events.bookingStatus.confirmed")}
    </span>
  );
  const renderParticipant = (participant: BookingParticipantSummary) => (
    <ParticipantRow key={participant.id} participant={participant} aside={confirmedAside} />
  );

  return (
    <ParticipantListState
      state={participants}
      emptyText={t("events.participants.noPlayers")}
      renderItem={renderParticipant}
    />
  );
}
