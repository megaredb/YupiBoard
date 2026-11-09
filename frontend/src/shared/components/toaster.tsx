import { useEffect } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { dismissToast, useToasts, type Toast } from "@/shared/lib/toast/toast-store";
import { Button } from "@/shared/ui/button";

const AUTO_DISMISS_MS = 5000;

function ToastItem({ toast, closeLabel }: { toast: Toast; closeLabel: string }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : Info;
  const handleDismiss = () => dismissToast(toast.id);

  useEffect(() => {
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id]);

  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border bg-popover px-4 py-2.5 text-sm font-medium text-popover-foreground shadow-lg">
      <span className="flex items-center gap-2">
        <Icon aria-hidden className="size-4 shrink-0 text-primary" />
        <span>{toast.message}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={closeLabel}
        onClick={handleDismiss}
      >
        <X aria-hidden />
      </Button>
    </li>
  );
}

/** Renders the shared toast queue; mounted once by the app shell. */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToasts();

  return (
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1rem,var(--safe-bottom),calc(var(--bottom-bar-inset)+0.5rem))] z-60 mx-auto flex w-full max-w-md flex-col gap-2 px-4 *:pointer-events-auto"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} closeLabel={t("common.close")} />
      ))}
    </ol>
  );
}
