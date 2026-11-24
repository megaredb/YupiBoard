import { CircleCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ui/badge";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";

const CHECK_KEYS = [
  "admin.moderation.autoCheck.requiredFields",
  "admin.moderation.autoCheck.forbiddenWords",
  "admin.moderation.autoCheck.duplicates",
] as const;

/**
 * An event only reaches the queue after the automatic check passed (a failed one is rejected on
 * creation), so the card always reports a pass. The backend stores no per-check result.
 */
export function AutoCheckCard() {
  const { t } = useTranslation();

  return (
    <Card size="lg">
      <Card.Header className="grid-cols-[1fr_auto] items-center">
        <Card.Title>{t("admin.moderation.autoCheck.title")}</Card.Title>
        <Badge variant="success">{t("admin.moderation.autoCheck.passedShort")}</Badge>
      </Card.Header>
      <Card.Content className="space-y-4">
        <Separator />
        <ul className="space-y-2.5 text-sm">
          {CHECK_KEYS.map((key) => (
            <li key={key} className="flex items-center gap-2.5">
              <CircleCheck aria-hidden className="size-4 shrink-0 text-success" />
              {t(key)}
            </li>
          ))}
        </ul>
      </Card.Content>
    </Card>
  );
}
