import { useState } from "react";
import { WifiOff, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";

/**
 * Floats above the bottom bars instead of taking a row at the top, where it would sit under the
 * status bar and push the safe-area padding of phone top bars down. Unmounted while online, so a
 * dismissed notice comes back the next time the connection drops.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  return isOnline ? null : <OfflineNotice />;
}

function OfflineNotice() {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(false);
  const handleDismiss = () => setIsDismissed(true);
  if (isDismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-above-bars z-40 flex justify-center px-4 keyboard-open:hidden">
      <output className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border bg-muted py-1 pr-1 pl-3 text-[0.6875rem] font-medium text-muted-foreground shadow-md">
        <WifiOff aria-hidden className="size-3 shrink-0" />
        <span>{t("errors.offline")}</span>
        <button
          type="button"
          aria-label={t("common.close")}
          className="touch-hitbox relative flex size-7 shrink-0 items-center justify-center rounded-full hover:text-foreground"
          onClick={handleDismiss}
        >
          <X aria-hidden className="size-3.5" />
        </button>
      </output>
    </div>
  );
}
