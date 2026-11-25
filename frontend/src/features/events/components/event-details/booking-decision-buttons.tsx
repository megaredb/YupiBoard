import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui/button";
import { DeclineParticipantDialog } from "@/features/events/components/event-details/decline-participant-dialog";

interface BookingDecisionButtonsProps {
  playerName: string;
  /** Shown instead of "Accept" once the player is accepted ("Confirmed", "Gets the next seat"). */
  acceptedLabel: string | null;
  isPending: boolean;
  isDisabled: boolean;
  onDecide: (isApproved: boolean, reason?: string) => void;
}

/** "Accept" right away; "Decline" asks for a mandatory reason first. */
export function BookingDecisionButtons({
  playerName,
  acceptedLabel,
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
      {acceptedLabel === null ? (
        <Button size="lg" isLoading={isPending} disabled={isDisabled} onClick={handleAccept}>
          {t("events.participants.accept")}
        </Button>
      ) : (
        <span className="text-xs font-semibold text-foreground">{acceptedLabel}</span>
      )}
      <Button
        variant="secondary"
        size="lg"
        isLoading={acceptedLabel !== null && isPending}
        disabled={isDisabled || isPending}
        onClick={handleAskDecline}
      >
        {t("events.participants.decline")}
      </Button>
      {isConfirming && (
        <DeclineParticipantDialog
          playerName={playerName}
          onConfirm={handleDecline}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}
