import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const LOW_SEATS_THRESHOLD = 0.3;

const seatAvailabilityVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1 text-xs leading-none font-medium tabular-nums",
  {
    variants: {
      availability: {
        available: "bg-muted text-primary dark:bg-secondary-foreground",
        low: "bg-secondary-soft text-warning dark:bg-secondary dark:text-secondary-foreground",
        full: "bg-secondary-foreground text-secondary",
      },
    },
    defaultVariants: {
      availability: "available",
    },
  },
);

type SeatAvailability = NonNullable<VariantProps<typeof seatAvailabilityVariants>["availability"]>;

function getSeatAvailability(current: number, max: number): SeatAvailability {
  if (max <= 0) return "available";
  const remaining = Math.max(0, max - current);
  if (remaining === 0) return "full";
  return remaining / max < LOW_SEATS_THRESHOLD ? "low" : "available";
}

function SeatGroupIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-4 shrink-0", className)}
    >
      <circle cx="12" cy="7.2" r="2.7" />
      <rect x="8.3" y="11" width="7.4" height="9" rx="3.4" />
      <circle cx="5.8" cy="8.8" r="2.1" />
      <path d="M5.6 12C3.9 12 2.8 13.1 2.8 14.8v2.7c0 1.2.9 2 2.1 2h2.4c-.3-.7-.4-1.4-.4-2.2v-2.8c0-1 .3-1.8.8-2.5H5.6Z" />
      <circle cx="18.2" cy="8.8" r="2.1" />
      <path d="M18.4 12h-2.1c.5.7.8 1.5.8 2.5v2.8c0 .8-.1 1.5-.4 2.2h2.4c1.2 0 2.1-.8 2.1-2v-2.7c0-1.7-1.1-2.8-2.8-2.8Z" />
    </svg>
  );
}

interface SeatAvailabilityBadgeProps {
  current: number;
  max: number;
  label: string;
  availability?: SeatAvailability;
  className?: string;
}

export function SeatAvailabilityBadge({
  current,
  max,
  label,
  availability,
  className,
}: SeatAvailabilityBadgeProps) {
  const resolved = availability ?? getSeatAvailability(current, max);

  return (
    <span
      aria-label={label}
      className={cn(seatAvailabilityVariants({ availability: resolved }), className)}
    >
      <span aria-hidden>{`${current} / ${max}`}</span>
      <SeatGroupIcon />
    </span>
  );
}
