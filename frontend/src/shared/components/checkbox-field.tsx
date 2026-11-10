import { FormField } from "@/shared/components/form-field";
import { Checkbox } from "@/shared/ui/checkbox";

interface CheckboxFieldProps {
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  error?: string;
  isDisabled?: boolean;
}

export function CheckboxField({
  label,
  isChecked,
  onCheckedChange,
  error,
  isDisabled,
}: CheckboxFieldProps) {
  return (
    <FormField
      label={label}
      error={error}
      className="flex flex-row-reverse flex-wrap items-center justify-end gap-2.5 space-y-0 [&>p]:w-full"
    >
      {(fieldControl) => (
        <Checkbox
          {...fieldControl}
          checked={isChecked}
          onCheckedChange={onCheckedChange}
          disabled={isDisabled}
        />
      )}
    </FormField>
  );
}
