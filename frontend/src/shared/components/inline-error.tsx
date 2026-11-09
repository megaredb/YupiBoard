import { CircleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface InlineErrorProps {
  message: string;
  id?: string;
  className?: string;
}

export function InlineError({ message, id, className }: InlineErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={cn("flex items-center gap-1.5 text-xs text-destructive", className)}
    >
      <CircleAlert aria-hidden className="size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}
