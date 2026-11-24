import { useTranslation } from "react-i18next";
import type { BookingRead, BookingStatus } from "@/shared/api/generated/model";
import { AttendanceButtons } from "@/features/events/components/event-details/attendance-buttons";
import { ParticipantListState } from "@/features/events/components/event-details/participant-list-state";
import { ParticipantRow } from "@/features/events/components/event-details/participant-row";
import { useEventBookings } from "@/features/events/hooks/use-event-bookings";
import { useMarkAttendance } from "@/features/events/hooks/use-mark-attendance";
import { RatePlayerButton } from "@/features/reviews";
import { getFullName } from "@/features/users";

/** The API caps a page at 100, which is enough for any table. */
const ATTENDANCE_PAGE_SIZE = 100;

interface HostAttendanceGroupsProps {
  eventId: string;
  canMark: boolean;
}

interface AttendanceGroupProps extends HostAttendanceGroupsProps {
  status: Extract<BookingStatus, "Confirmed" | "Attended" | "NoShow">;
  titleKey:
    "events.attendance.awaiting" | "events.attendance.attended" | "events.attendance.noShow";
  emptyText: string;
}

function AttendanceGroup({ eventId, canMark, status, titleKey, emptyText }: AttendanceGroupProps) {
  const { t } = useTranslation();
  const bookings = useEventBookings(eventId, 1, status, ATTENDANCE_PAGE_SIZE);
  const attendance = useMarkAttendance(eventId);

  // Only the "awaiting" group is always visible; the others appear once somebody lands in them.
  if (status !== "Confirmed" && bookings.total === 0) return null;

  const renderBooking = (booking: BookingRead) => {
    const participant = booking.user ?? { id: booking.user_id };
    const playerName = getFullName(participant) ?? t("events.participants.unnamed");
    return (
      <ParticipantRow
        key={booking.id}
        participant={participant}
        aside={
          <AttendanceButtons
            status={booking.status}
            canMark={canMark}
            isPending={attendance.pendingBookingId === booking.id}
            isDisabled={attendance.pendingBookingId !== null}
            onMark={(attended) => attendance.mark(booking.id, attended)}
            attendedExtra={
              <RatePlayerButton
                eventId={eventId}
                playerId={booking.user_id}
                playerName={playerName}
              />
            }
          />
        }
      />
    );
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        {t(titleKey, { count: bookings.total ?? 0 })}
      </h3>
      <ParticipantListState
        state={bookings.list}
        emptyText={emptyText}
        renderItem={renderBooking}
      />
    </section>
  );
}

/** Host view of confirmed players once the event has started: who's still to be marked, who came, who didn't. */
export function HostAttendanceGroups({ eventId, canMark }: HostAttendanceGroupsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        status="Confirmed"
        titleKey="events.attendance.awaiting"
        emptyText={t("events.attendance.allMarked")}
      />
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        status="Attended"
        titleKey="events.attendance.attended"
        emptyText={t("events.participants.noPlayers")}
      />
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        status="NoShow"
        titleKey="events.attendance.noShow"
        emptyText={t("events.participants.noPlayers")}
      />
    </div>
  );
}
