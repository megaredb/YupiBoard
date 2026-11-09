import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Toaster as Sonner } from "sonner";
import { useResolvedTheme } from "@/shared/hooks/use-theme";

const TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 3;

/**
 * Clear of the tab bar or booking bar (`--bottom-bar-inset`), the home indicator and the Android
 * keyboard. The Toaster renders in place (no portal), so it inherits these variables from the shell.
 */
const BOTTOM_OFFSET =
  "max(1rem, calc(var(--safe-bottom) + 0.5rem), calc(var(--bottom-bar-inset) + 0.75rem), calc(var(--keyboard-inset) + 0.75rem))";

const ICONS = {
  success: <CircleCheck aria-hidden className="size-5 text-success" />,
  error: <CircleAlert aria-hidden className="size-5 text-destructive" />,
  info: <Info aria-hidden className="size-5 text-primary" />,
  warning: <TriangleAlert aria-hidden className="size-5 text-secondary-foreground" />,
  loading: <LoaderCircle aria-hidden className="size-5 animate-spin text-muted-foreground" />,
};

const TOAST_CLASS_NAMES = {
  toast: "toast gap-3 font-sans shadow-lg",
  title: "text-sm leading-snug font-semibold",
  description: "text-sm leading-snug",
  icon: "self-start mt-0.5",
};

/** Renders the shared toast queue (sonner); mounted once by the app shell. Colours: toaster.css. */
export function Toaster() {
  const { t } = useTranslation();
  const theme = useResolvedTheme();

  return (
    <Sonner
      theme={theme}
      position="bottom-right"
      duration={TOAST_DURATION_MS}
      visibleToasts={MAX_VISIBLE_TOASTS}
      closeButton
      icons={ICONS}
      offset={{ bottom: BOTTOM_OFFSET, right: "1rem" }}
      mobileOffset={{ bottom: BOTTOM_OFFSET, left: "1rem", right: "1rem" }}
      containerAriaLabel={t("common.notifications")}
      toastOptions={{ classNames: TOAST_CLASS_NAMES, closeButtonAriaLabel: t("common.close") }}
    />
  );
}
