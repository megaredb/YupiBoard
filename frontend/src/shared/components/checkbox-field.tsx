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
      className="grid grid-cols-[auto_1fr] items-start space-y-0 gap-x-2.5 gap-y-1.5 [&>label]:col-start-2 [&>label]:leading-snug [&>p]:col-span-2"
    >
      {(fieldControl) => (
        <Checkbox
          {...fieldControl}
          className="col-start-1 row-start-1 mt-0.5"
          checked={isChecked}
          onCheckedChange={onCheckedChange}
          disabled={isDisabled}
        />
      )}
    </FormField>
  );
}
