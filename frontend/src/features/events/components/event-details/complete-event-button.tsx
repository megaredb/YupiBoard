import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { CompleteEventAction } from "@/features/events/hooks/use-complete-event";

interface CompleteEventButtonProps {
  action: CompleteEventAction;
  isCompact?: boolean;
  className?: string;
}

export function CompleteEventButton({
  action,
  isCompact = false,
  className,
}: CompleteEventButtonProps) {
  const { t } = useTranslation();
  const [isConfirming, setConfirming] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size={isCompact ? "lg" : "xl"}
        className={cn("text-sm shadow-sm", className)}
        isLoading={action.isPending}
        onClick={() => setConfirming(true)}
      >
        {t("events.completeEvent.button")}
      </Button>
      {isConfirming && (
        <ConfirmDialog
          title={t("events.completeEvent.dialog.title")}
          description={t("events.completeEvent.dialog.description")}
          cancelLabel={t("events.completeEvent.dialog.keep")}
          confirmLabel={t("events.completeEvent.dialog.confirm")}
          onConfirm={action.complete}
          onClose={() => setConfirming(false)}
        />
      )}
    </>
  );
}
