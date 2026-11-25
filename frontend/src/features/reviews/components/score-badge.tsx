import type { ComponentProps } from "react";
import { Star } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface ScoreBadgeProps extends ComponentProps<"button"> {
  score: number;
}

export function ScoreBadge({ score, className, ...props }: ScoreBadgeProps) {
  return (
    <button
      type="button"
      className={cn(
        "touch-hitbox relative inline-flex h-10 min-w-16 items-center justify-center gap-1 rounded-lg bg-primary/10 px-4 text-sm font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring/50 enabled:hover:bg-primary/15 disabled:cursor-default",
        className,
      )}
      {...props}
    >
      {score}
      <Star aria-hidden className="size-4" />
    </button>
  );
}
