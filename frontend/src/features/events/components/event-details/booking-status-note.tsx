import { cva } from "class-variance-authority";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { BOOKING_STATE_LABEL_KEYS } from "@/features/events/lib/booking-state-label-keys";
import type { BookingState } from "@/features/events/lib/get-booking-state";

interface BookingStatusNoteProps {
  state: BookingState;
  className?: string;
}

const noteVariants = cva(
  "flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-center text-sm font-medium",
  {
    variants: {
      tone: {
        approved: "border-success/30 bg-success/5 text-success",
        rejected: "border-destructive/30 bg-destructive/5 text-destructive",
        pending: "border-primary/30 bg-primary/5 text-primary",
      },
    },
  },
);

function getNoteTone(state: BookingState): "approved" | "rejected" | "pending" {
  if (state === "approved") return "approved";
  if (state === "rejected") return "rejected";
  return "pending";
}

export function BookingStatusNote({ state, className }: BookingStatusNoteProps) {
  const { t } = useTranslation();
  const tone = getNoteTone(state);

  return (
    <output className={cn(noteVariants({ tone }), className)}>
      <span>{t(BOOKING_STATE_LABEL_KEYS[state])}</span>
      {tone === "approved" && <Check aria-hidden className="size-4" />}
      {tone === "rejected" && <X aria-hidden className="size-4" />}
    </output>
  );
}
