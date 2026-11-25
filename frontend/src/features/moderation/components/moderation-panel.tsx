import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { AutoCheckCard } from "@/features/moderation/components/auto-check-card";
import { RejectEventDialog } from "@/features/moderation/components/reject-event-dialog";
import { useModerateEvent } from "@/features/moderation/hooks/use-moderate-event";

interface ModerationPanelProps {
  event: Pick<EventRead, "id" | "title" | "auto_check_status">;
}

/** Auto-check result and the publish / reject decision; shown instead of the booking panel. */
export function ModerationPanel({ event }: ModerationPanelProps) {
  const { t } = useTranslation();
  const [isRejecting, setRejecting] = useState(false);
  const moderation = useModerateEvent(event.id);

  const handleApprove = () => moderation.decide({ isApproved: true });
  const handleReject = (reason: string) => {
    setRejecting(false);
    moderation.decide({ isApproved: false, reason });
  };
  const handleAskReject = () => setRejecting(true);
  const handleCloseDialog = () => setRejecting(false);

  return (
    <div className="space-y-4">
      <AutoCheckCard status={event.auto_check_status} />
      <Card size="lg">
        <Card.Header>
          <Card.Title>{t("moderation.panel.title")}</Card.Title>
          <Card.Description>{t("moderation.panel.description")}</Card.Description>
        </Card.Header>
        <Card.Content className="space-y-3">
          <Button
            size="xl"
            className="w-full"
            isLoading={moderation.isPending}
            onClick={handleApprove}
          >
            {t("moderation.panel.approve")}
          </Button>
          <Button
            variant="secondary"
            size="xl"
            className="w-full"
            disabled={moderation.isPending}
            onClick={handleAskReject}
          >
            {t("moderation.panel.reject")}
          </Button>
          <p className="pt-1 text-xs text-muted-foreground">{t("moderation.panel.note")}</p>
        </Card.Content>
      </Card>
      {isRejecting && (
        <RejectEventDialog
          eventTitle={event.title}
          onConfirm={handleReject}
          onClose={handleCloseDialog}
        />
      )}
    </div>
  );
}
