import type { BookingRead } from "@/shared/api/generated/model";
import type { ListState } from "@/shared/lib/list-state";
import { useEventBookings } from "@/features/events/hooks/use-event-bookings";

/** The API caps a page at 100, which is more than any table seats. */
const ROSTER_PAGE_SIZE = 100;

interface AttendanceCounts {
  attended: number;
  noShow: number;
  notMarked: number;
}

interface AttendanceRoster {
  list: ListState<BookingRead>;
  counts: AttendanceCounts | null;
}

/**
 * While the three lists refetch after a mark, one booking can sit in its old list and its new one
 * at once; the newer copy wins so every booking is shown once.
 */
function dedupeBookings(bookings: BookingRead[]): BookingRead[] {
  const byId = new Map<string, BookingRead>();
  for (const booking of bookings) {
    const seen = byId.get(booking.id);
    if (!seen || Date.parse(booking.updated_at) > Date.parse(seen.updated_at)) {
      byId.set(booking.id, booking);
    }
  }
  return [...byId.values()].toSorted((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
}

export function useAttendanceRoster(eventId: string): AttendanceRoster {
  const notMarked = useEventBookings(eventId, 1, "Confirmed", ROSTER_PAGE_SIZE);
  const attended = useEventBookings(eventId, 1, "Attended", ROSTER_PAGE_SIZE);
  const noShow = useEventBookings(eventId, 1, "NoShow", ROSTER_PAGE_SIZE);
  const groups = [notMarked.list, attended.list, noShow.list];

  const failed = groups.find((group) => group.status === "error");
  if (failed) {
    const retry = () => groups.forEach((group) => group.status === "error" && group.retry());
    return { list: { status: "error", retry }, counts: null };
  }
  const items = dedupeBookings(
    groups.flatMap((group) => (group.status === "success" ? group.items : [])),
  );
  if (groups.some((group) => group.status === "pending")) {
    return { list: { status: "pending" }, counts: null };
  }
  return {
    list: { status: "success", items },
    counts: {
      attended: items.filter((item) => item.status === "Attended").length,
      noShow: items.filter((item) => item.status === "NoShow").length,
      notMarked: items.filter((item) => item.status === "Confirmed").length,
    },
  };
}
