import { useTranslation } from "react-i18next";
import type { BookingRead, EventRead } from "@/shared/api/generated/model";
import { AttendanceAside } from "@/features/events/components/event-details/attendance-aside";
import { AttendanceDeadline } from "@/features/events/components/event-details/attendance-deadline";
import { ParticipantListState } from "@/features/events/components/event-details/participant-list-state";
import { ParticipantRow } from "@/features/events/components/event-details/participant-row";
import { useAttendanceRoster } from "@/features/events/hooks/use-attendance-roster";
import { useMarkAttendance } from "@/features/events/hooks/use-mark-attendance";
import { RatePlayerButton } from "@/features/reviews";
import { getFullName } from "@/features/users";

interface AttendanceRosterProps {
  event: Pick<EventRead, "id" | "review_deadline">;
  canMark: boolean;
}

export function AttendanceRoster({ event, canMark }: AttendanceRosterProps) {
  const { t } = useTranslation();
  const roster = useAttendanceRoster(event.id);
  const attendance = useMarkAttendance(event.id);
  const { counts } = roster;

  const renderBooking = (booking: BookingRead) => {
    const participant = booking.user ?? { id: booking.user_id };
    const playerName = getFullName(participant) ?? t("events.participants.unnamed");
    return (
      <ParticipantRow
        key={booking.id}
        participant={participant}
        aside={
          <AttendanceAside
            status={booking.status}
            canMark={canMark}
            isPending={attendance.pendingBookingId === booking.id}
            isDisabled={attendance.pendingBookingId !== null}
            onMark={(attended) => attendance.mark(booking.id, attended)}
            rating={
              <RatePlayerButton
                eventId={event.id}
                playerId={booking.user_id}
                playerName={playerName}
                hasAttended={booking.status === "Attended"}
              />
            }
          />
        }
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        {counts && (
          <p className="text-sm text-muted-foreground">
            {t("events.attendance.summary", {
              total: counts.attended + counts.noShow + counts.notMarked,
              ...counts,
            })}
          </p>
        )}
        <AttendanceDeadline deadline={event.review_deadline} isOpen={canMark} />
      </div>
      <ParticipantListState
        state={roster.list}
        emptyText={t("events.participants.noPlayers")}
        renderItem={renderBooking}
      />
    </div>
  );
}
