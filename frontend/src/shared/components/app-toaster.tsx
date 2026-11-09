import { useTranslation } from "react-i18next";
import { useResolvedTheme } from "@/shared/hooks/use-theme";
import { Toaster } from "@/shared/ui/sonner";

const MAX_VISIBLE_TOASTS = 3;

/**
 * Clear of the tab bar or booking bar (`--bottom-bar-inset`), the home indicator and the Android
 * keyboard. sonner renders in place (no portal), so the shell's variables apply.
 */
const BOTTOM_OFFSET =
  "max(1rem, calc(var(--safe-bottom) + 0.5rem), calc(var(--bottom-bar-inset) + 0.75rem), calc(var(--keyboard-inset) + 0.75rem))";

/** The app's one toaster (ST-5), mounted by the shell; `showToast` feeds it. */
export function AppToaster() {
  const { t } = useTranslation();
  const theme = useResolvedTheme();

  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      visibleToasts={MAX_VISIBLE_TOASTS}
      closeButton
      offset={{ bottom: BOTTOM_OFFSET, right: "1rem" }}
      mobileOffset={{ bottom: BOTTOM_OFFSET, left: "1rem", right: "1rem" }}
      containerAriaLabel={t("common.notifications")}
      toastOptions={{ closeButtonAriaLabel: t("common.close") }}
    />
  );
}
