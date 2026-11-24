import { useId } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { CheckboxField } from "@/shared/components/checkbox-field";
import { FormField } from "@/shared/components/form-field";
import { InlineError } from "@/shared/components/inline-error";
import { useFieldError } from "@/shared/i18n/use-field-error";
import type { RejectionReasonOption } from "@/shared/lib/rejection-reason/build-rejection-reason";
import {
  REJECTION_REASON_MAX_LENGTH,
  type RejectionReasonFormValues,
} from "@/shared/lib/rejection-reason/rejection-reason.schema";
import { toggleListValue } from "@/shared/lib/toggle-list-value";
import { Textarea } from "@/shared/ui/textarea";

interface RejectionReasonChecklistProps {
  options: readonly RejectionReasonOption[];
  reasonsLabel: string;
  otherLabel: string;
  otherPlaceholder: string;
}

interface PresetReasonListProps {
  options: readonly RejectionReasonOption[];
  selectedIds: readonly string[];
  onChange: (selectedIds: string[]) => void;
}

function PresetReasonList({ options, selectedIds, onChange }: PresetReasonListProps) {
  const handleToggleReason = (id: string, isChecked: boolean) =>
    onChange(toggleListValue(selectedIds, id, isChecked));

  return options.map((option) => (
    <CheckboxField
      key={option.id}
      label={option.label}
      isChecked={selectedIds.includes(option.id)}
      onCheckedChange={(isChecked) => handleToggleReason(option.id, isChecked)}
    />
  ));
}

/** Preset reasons plus an "other" option with free text; at least one reason is required. */
export function RejectionReasonChecklist({
  options,
  reasonsLabel,
  otherLabel,
  otherPlaceholder,
}: RejectionReasonChecklistProps) {
  const { control, register, formState } = useFormContext<RejectionReasonFormValues>();
  const isOtherChecked = useWatch({ control, name: "isOtherChecked" });
  const fieldError = useFieldError();
  const errorId = useId();
  const reasonError = fieldError(formState.errors.presetReasonIds?.message);
  const otherTextError = fieldError(formState.errors.otherText?.message);

  return (
    <fieldset aria-describedby={reasonError && errorId} className="space-y-2.5">
      <legend className="mb-3 text-sm font-semibold text-foreground">
        {reasonsLabel}
        <span aria-hidden className="ml-0.5 text-destructive">
          {"*"}
        </span>
      </legend>
      <Controller
        control={control}
        name="presetReasonIds"
        render={({ field }) => (
          <PresetReasonList options={options} selectedIds={field.value} onChange={field.onChange} />
        )}
      />
      <Controller
        control={control}
        name="isOtherChecked"
        render={({ field }) => (
          <CheckboxField
            label={otherLabel}
            isChecked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      {isOtherChecked && (
        <FormField label={otherLabel} isLabelHidden error={otherTextError}>
          {(fieldControl) => (
            <Textarea
              {...fieldControl}
              rows={3}
              maxLength={REJECTION_REASON_MAX_LENGTH}
              placeholder={otherPlaceholder}
              className="rounded-xl"
              {...register("otherText")}
            />
          )}
        </FormField>
      )}
      {reasonError && <InlineError id={errorId} message={reasonError} />}
    </fieldset>
  );
}
