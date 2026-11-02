import { cva } from "class-variance-authority";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface FormAlertProps {
  message: string;
  tone?: "error" | "success";
  className?: string;
}

const alertVariants = cva(
  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
  {
    variants: {
      tone: {
        error: "border-destructive/30 bg-destructive/10 text-destructive",
        success: "border-success/30 bg-success/10 text-success",
      },
    },
  },
);

/** Form-level message (server error, saved). Field errors belong to `FormField`. */
export function FormAlert({ message, tone = "error", className }: FormAlertProps) {
  const Icon = tone === "error" ? CircleAlert : CheckCircle2;
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
