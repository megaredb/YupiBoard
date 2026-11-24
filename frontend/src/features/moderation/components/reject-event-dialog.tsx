import { useTranslation } from "react-i18next";
import {
  RejectionReasonDialog,
  type RejectionReasonCopy,
} from "@/shared/components/rejection-reason-dialog";
import { EVENT_REJECTION_REASON_KEYS } from "@/features/moderation/lib/event-rejection-reason-keys";

interface RejectEventDialogProps {
  eventTitle: string;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

// Not rendered yet: the API has `EventStatus.Rejected` but no endpoint for a moderator to reject
// an event with a reason. Wire this dialog to that mutation once the backend provides it.
export function RejectEventDialog({ eventTitle, onConfirm, onClose }: RejectEventDialogProps) {
  const { t } = useTranslation();
  const options = EVENT_REJECTION_REASON_KEYS.map((key) => ({ id: key, label: t(key) }));
  const copy: RejectionReasonCopy = {
    title: t("moderation.rejectEvent.title", { title: eventTitle }),
    description: t("moderation.rejectEvent.description", { title: eventTitle }),
    reasonsLabel: t("moderation.rejectEvent.reasonsLabel"),
    otherLabel: t("moderation.rejectEvent.reasons.other"),
    otherPlaceholder: t("moderation.rejectEvent.otherPlaceholder"),
    confirmLabel: t("moderation.rejectEvent.confirm"),
    cancelLabel: t("common.cancel"),
  };

  return (
    <RejectionReasonDialog copy={copy} options={options} onConfirm={onConfirm} onClose={onClose} />
  );
}
