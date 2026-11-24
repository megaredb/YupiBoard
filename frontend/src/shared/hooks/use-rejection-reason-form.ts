import { useAppForm } from "@/shared/hooks/use-app-form";
import {
  buildRejectionReason,
  type RejectionReasonOption,
} from "@/shared/lib/rejection-reason/build-rejection-reason";
import { rejectionReasonSchema } from "@/shared/lib/rejection-reason/rejection-reason.schema";

export function useRejectionReasonForm(
  options: readonly RejectionReasonOption[],
  onConfirm: (reason: string) => void,
) {
  const form = useAppForm(rejectionReasonSchema, {
    defaultValues: { presetReasonIds: [], isOtherChecked: false, otherText: "" },
  });
  const submit = form.handleSubmit((values) => onConfirm(buildRejectionReason(values, options)));

  return { form, submit };
}
