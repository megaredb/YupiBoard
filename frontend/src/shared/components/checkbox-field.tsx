import { FormField } from "@/shared/components/form-field";
import { Checkbox } from "@/shared/ui/checkbox";

interface CheckboxFieldProps {
  label: string;
  isChecked: boolean;
  onCheckedChange: (isChecked: boolean) => void;
  isRequired?: boolean;
  error?: string;
  isDisabled?: boolean;
}

export function CheckboxField({
  label,
  isChecked,
  onCheckedChange,
  isRequired,
  error,
  isDisabled,
}: CheckboxFieldProps) {
  return (
    <FormField
      label={label}
      isRequired={isRequired}
      error={error}
      className="grid grid-cols-[auto_1fr] items-start space-y-0 gap-x-2.5 gap-y-1.5 [&>label]:col-start-2 [&>label]:inline [&>label]:leading-snug [&>label>span+span]:ml-1 [&>p]:col-span-2"
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
