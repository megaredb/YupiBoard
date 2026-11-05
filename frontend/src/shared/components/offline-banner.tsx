import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";

export function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <output className="flex items-center justify-center gap-2 bg-muted px-4 py-2 text-xs font-medium text-muted-foreground">
      <WifiOff aria-hidden className="size-3.5" />
      <span>{t("errors.offline")}</span>
    </output>
  );
}
