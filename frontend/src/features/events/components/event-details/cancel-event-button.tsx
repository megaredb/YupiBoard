import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import type { CancelEventAction } from "@/features/events/hooks/use-cancel-event";

interface CancelEventButtonProps {
  action: CancelEventAction;
  confirmedCount: number;
  isCompact?: boolean;
  className?: string;
}

export function CancelEventButton({
  action,
  confirmedCount,
  isCompact = false,
  className,
}: CancelEventButtonProps) {
  const { t } = useTranslation();
  const [isConfirming, setConfirming] = useState(false);
  const handleOpen = () => setConfirming(true);
  const handleClose = () => setConfirming(false);

  return (
    <>
      <Button
        variant="secondary"
        size={isCompact ? "lg" : "xl"}
        className={cn("shadow-sm", className)}
        isLoading={action.isPending}
        onClick={handleOpen}
      >
        {t("events.cancelEvent.button")}
      </Button>
      {isConfirming && (
        <ConfirmDialog
          title={t("events.cancelEvent.dialog.title")}
          description={t("events.cancelEvent.dialog.description", { count: confirmedCount })}
          cancelLabel={t("events.cancelEvent.dialog.keep")}
          confirmLabel={t("events.cancelEvent.dialog.confirm")}
          onConfirm={action.cancel}
          onClose={handleClose}
        />
      )}
    </>
  );
}
