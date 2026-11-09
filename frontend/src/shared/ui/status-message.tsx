import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

interface StatusMessageProps {
  title: string;
  description?: string;
  action?: ReactNode;
  /** `compact` for a state inside a card section instead of a whole page or list. */
  size?: "default" | "compact";
  className?: string;
}

const messageVariants = cva(
  "flex flex-col items-center justify-center rounded-xl border border-dashed text-center",
  {
    variants: {
      size: {
        default: "px-6 py-16",
        compact: "px-4 py-6",
      },
    },
  },
);

export function StatusMessage({
  title,
  description,
  action,
  size = "default",
  className,
}: StatusMessageProps) {
  return (
    <div className={cn(messageVariants({ size }), className)}>
      <p className={size === "compact" ? "text-sm font-medium" : "text-base font-medium"}>
        {title}
      </p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
