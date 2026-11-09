import { formatMonthYear } from "@/shared/lib/format/format-date";

export function formatMemberSince(createdAt: string | undefined): string | null {
  return createdAt ? formatMonthYear(createdAt) : null;
}
