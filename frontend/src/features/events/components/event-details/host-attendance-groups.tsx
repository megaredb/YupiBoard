import { useTranslation } from "react-i18next";
import { AttendanceGroup } from "@/features/events/components/event-details/attendance-group";
import { useMarkAttendance } from "@/features/events/hooks/use-mark-attendance";

interface HostAttendanceGroupsProps {
  eventId: string;
  canMark: boolean;
}

/** Host view of confirmed players once the event has started: who's still to be marked, who came, who didn't. */
export function HostAttendanceGroups({ eventId, canMark }: HostAttendanceGroupsProps) {
  const { t } = useTranslation();
  const attendance = useMarkAttendance(eventId);

  return (
    <div className="space-y-6">
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        attendance={attendance}
        status="Confirmed"
        titleKey="events.attendance.awaiting"
        emptyText={t("events.attendance.allMarked")}
      />
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        attendance={attendance}
        status="Attended"
        titleKey="events.attendance.attended"
        emptyText={t("events.participants.noPlayers")}
      />
      <AttendanceGroup
        eventId={eventId}
        canMark={canMark}
        attendance={attendance}
        status="NoShow"
        titleKey="events.attendance.noShow"
        emptyText={t("events.participants.noPlayers")}
      />
    </div>
  );
}
