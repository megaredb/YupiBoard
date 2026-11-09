import { toast } from "sonner";

type ToastTone = "success" | "error" | "info";

interface ToastOptions {
  tone?: ToastTone;
  /** Second line under the message, e.g. what the user can do next. */
  description?: string;
}

/** Errors stay longer than the default duration of the `Toaster` so they are not missed. */
const ERROR_DURATION_MS = 8000;

/**
 * The one mechanism for transient feedback (saved, cancelled, failed…), rendered by the `Toaster`
 * in the app shell. Text must already be translated.
 */
export function showToast(
  message: string,
  { tone = "success", description }: ToastOptions = {},
): void {
  if (tone === "error") toast.error(message, { description, duration: ERROR_DURATION_MS });
  else if (tone === "info") toast.info(message, { description });
  else toast.success(message, { description });
}
