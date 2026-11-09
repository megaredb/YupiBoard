import { cva } from "class-variance-authority";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type AlertTone = "error" | "success" | "info" | "warning";

interface FormAlertProps {
  message: string;
  tone?: AlertTone;
  className?: string;
}

const alertVariants = cva(
  "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium [&>svg]:mt-0.5",
  {
    variants: {
      tone: {
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        success: "border-success/30 bg-success/10 text-success",
        info: "border-primary/20 bg-primary/10 text-primary",
        warning: "border-secondary/60 bg-secondary/20 text-foreground",
      },
    },
  },
);

const TONE_ICONS = {
  error: CircleAlert,
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
} as const;

/** A notice above a form or flow (server error, saved, needs action). Field errors belong to `FormField`. */
export function FormAlert({ message, tone = "error", className }: FormAlertProps) {
  const Icon = TONE_ICONS[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(alertVariants({ tone }), className)}
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
