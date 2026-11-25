import { useTranslation } from "react-i18next";
import type { AutoCheckStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";

const BADGES = {
  Passed: { labelKey: "moderation.autoCheck.passed", variant: "success" },
  Failed: { labelKey: "moderation.autoCheck.failed", variant: "destructive" },
  Unavailable: { labelKey: "moderation.autoCheck.unavailable", variant: "warning" },
} as const satisfies Record<AutoCheckStatus, { labelKey: string; variant: string }>;

interface AutoCheckBadgeProps {
  status: AutoCheckStatus | null | undefined;
  isMuted?: boolean;
}

export function AutoCheckBadge({ status, isMuted = false }: AutoCheckBadgeProps) {
  const { t } = useTranslation();
  // Events created before the result was stored have none to show.
  if (!status) return null;
  const { labelKey, variant } = BADGES[status];
  return <Badge variant={isMuted ? "muted" : variant}>{t(labelKey)}</Badge>;
}
