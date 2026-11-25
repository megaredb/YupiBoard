import { CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { AutoCheckStatus } from "@/shared/api/generated/model";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

const CHECK_KEYS = [
  "moderation.autoCheck.requiredFields",
  "moderation.autoCheck.forbiddenWords",
  "moderation.autoCheck.duplicates",
] as const;

interface AutoCheckCardProps {
  status: AutoCheckStatus | null | undefined;
}

/**
 * Result of the automatic check. A failed check rejects the event on creation, so a queued event
 * either passed it or the check could not run; the backend stores no per-check detail.
 */
export function AutoCheckCard({ status }: AutoCheckCardProps) {
  const { t } = useTranslation();
  // Events created before the result was stored have none to show.
  if (!status || status === "Failed") return null;
  const isPassed = status === "Passed";

  return (
    <Card size="lg">
      <Card.Header className="grid-cols-[1fr_auto] items-center">
        <Card.Title>{t("moderation.autoCheck.title")}</Card.Title>
        <Badge variant={isPassed ? "success" : "warning"}>
          {isPassed
            ? t("moderation.autoCheck.passedShort")
            : t("moderation.autoCheck.unavailableShort")}
        </Badge>
      </Card.Header>
      <Card.Content className="space-y-4">
        <Separator />
        {isPassed ? (
          <ul className="space-y-2.5 text-sm">
            {CHECK_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2.5">
                <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
                {t(key)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("moderation.autoCheck.unavailableDescription")}
          </p>
        )}
      </Card.Content>
    </Card>
  );
}
