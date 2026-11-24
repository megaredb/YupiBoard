import { useTranslation } from "react-i18next";
import {
  RejectionReasonDialog,
  type RejectionReasonCopy,
} from "@/shared/components/rejection-reason-dialog";
import { PARTICIPANT_DECLINE_REASON_KEYS } from "@/features/events/lib/participant-decline-reason-keys";

interface DeclineParticipantDialogProps {
  playerName: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function DeclineParticipantDialog({
  playerName,
  onConfirm,
  onClose,
}: DeclineParticipantDialogProps) {
  const { t } = useTranslation();
  const options = PARTICIPANT_DECLINE_REASON_KEYS.map((key) => ({ id: key, label: t(key) }));
  const copy: RejectionReasonCopy = {
    title: t("events.participants.declineDialog.title"),
    description: t("events.participants.declineDialog.description", { name: playerName }),
    reasonsLabel: t("events.participants.declineDialog.reasonsLabel"),
    otherLabel: t("events.participants.declineDialog.reasons.other"),
    otherPlaceholder: t("events.participants.declineDialog.otherPlaceholder"),
    confirmLabel: t("events.participants.declineDialog.confirm"),
    cancelLabel: t("common.cancel"),
  };

  return (
    <RejectionReasonDialog copy={copy} options={options} onConfirm={onConfirm} onClose={onClose} />
  );
}
