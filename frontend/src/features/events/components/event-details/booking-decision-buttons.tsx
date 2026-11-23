import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RejectionReasonDialog } from "@/shared/components/rejection-reason-dialog";
import { Button } from "@/shared/ui/button";

interface BookingDecisionButtonsProps {
  playerName: string;
  showAccept?: boolean;
  isPending: boolean;
  isDisabled: boolean;
  onDecide: (isApproved: boolean, reason?: string) => void;
}

/** "Accept" right away; "Decline" asks for a mandatory reason first. */
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
  const handleDecline = (reason: string) => onDecide(false, reason);
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
        <RejectionReasonDialog
          mode="participant"
          targetName={playerName}
          onConfirm={handleDecline}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}
