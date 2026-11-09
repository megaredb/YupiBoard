import { cva } from "class-variance-authority";
import { Check } from "lucide-react";
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
      isApproved: {
        true: "border-success/30 bg-success/5 text-success",
        false: "border-primary/30 bg-primary/5 text-primary",
      },
    },
  },
);

/** Where the player's request stands: waiting, waitlisted or approved. */
export function BookingStatusNote({ state, className }: BookingStatusNoteProps) {
  const { t } = useTranslation();
  const isApproved = state === "approved";

  return (
    <output className={cn(noteVariants({ isApproved }), className)}>
      <span>{t(BOOKING_STATE_LABEL_KEYS[state])}</span>
      {isApproved && <Check aria-hidden className="size-4" />}
    </output>
  );
}
