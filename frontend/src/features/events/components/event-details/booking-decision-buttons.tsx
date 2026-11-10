import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { Button } from "@/shared/ui/button";

interface BookingDecisionButtonsProps {
  playerName: string;
  showAccept?: boolean;
  isPending: boolean;
  isDisabled: boolean;
  onDecide: (isApproved: boolean) => void;
}

/** "Accept" right away; "Decline" asks first, since a declined request cannot be reopened. */
export function BookingDecisionButtons({
  playerName,
  showAccept = true,
  isPending,
  isDisabled,
  onDecide,
}: BookingDecisionButtonsProps) {
  const { t } = useTranslation();
  const [isConfirming, setConfirming] = useState(false);
  const handleAccept = () => onDecide(true);
  const handleDecline = () => onDecide(false);
  const handleAskDecline = () => setConfirming(true);
  const handleCloseDialog = () => setConfirming(false);

  return (
    <>
      {showAccept ? (
        <Button size="lg" isLoading={isPending} disabled={isDisabled} onClick={handleAccept}>
          {t("events.participants.accept")}
        </Button>
      ) : (
        <span className="text-xs font-semibold text-foreground">
          {t("events.bookingStatus.confirmed")}
        </span>
      )}
      <Button
        variant="secondary"
        size="lg"
        isLoading={!showAccept && isPending}
        disabled={isDisabled || isPending}
        onClick={handleAskDecline}
      >
        {t("events.participants.decline")}
      </Button>
      {isConfirming && (
        <ConfirmDialog
          title={t("events.participants.declineDialog.title")}
          description={t("events.participants.declineDialog.description", { name: playerName })}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("events.participants.declineDialog.confirm")}
          onConfirm={handleDecline}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}
