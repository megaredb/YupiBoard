import type { RejectionReasonFormValues } from "@/shared/lib/rejection-reason/rejection-reason.schema";

export interface RejectionReasonOption {
  id: string;
  label: string;
}

/** The backend takes one free-text reason, so the picked labels and the custom text are joined. */
export function buildRejectionReason(
  { presetReasonIds, isOtherChecked, otherText }: RejectionReasonFormValues,
  options: readonly RejectionReasonOption[],
): string {
  const presetLabels = options
    .filter((option) => presetReasonIds.includes(option.id))
    .map((option) => option.label);
  const customReasons = isOtherChecked ? [otherText] : [];
  return [...presetLabels, ...customReasons].join("; ");
}
