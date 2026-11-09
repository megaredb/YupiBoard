import type { CSSProperties } from "react";
import { toast } from "sonner";

type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  tone?: ToastTone;
  /** Second line under the message, e.g. what the user can do next. */
  description?: string;
}

/** Errors stay longer so they are not missed. */
const DURATION_MS: Record<ToastTone, number> = { success: 5000, info: 5000, error: 8000 };

const SHOW = { success: toast.success, info: toast.info, error: toast.error } as const;

/** The timer bar in `styles/toaster.css` drains over the same time sonner waits to dismiss. */
function timerStyle(durationMs: number): CSSProperties {
  // React's style type has no custom properties; this one is read by `toaster.css`.
  return { "--toast-duration": `${durationMs}ms` } as CSSProperties;
}

/**
 * The one mechanism for transient feedback (saved, cancelled, failed…), rendered by the `Toaster`
 * in the app shell. Text must already be translated.
 */
export function showToast(
  message: string,
  { tone = "success", description }: ToastOptions = {},
): void {
  const duration = DURATION_MS[tone];
  SHOW[tone](message, { description, duration, style: timerStyle(duration) });
}
