import { useId, type ChangeEvent } from "react";
import { Label } from "@/shared/ui/label";
import { NativeSelect, type NativeSelectOption } from "@/shared/ui/native-select";

interface LabeledSelectProps {
  label: string;
  value: string;
  options: NativeSelectOption[];
  onChange: (value: string) => void;
}

export function LabeledSelect({ label, value, options, onChange }: LabeledSelectProps) {
  const id = useId();
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Label htmlFor={id} className="shrink-0 text-sm text-muted-foreground">
        {label}
      </Label>
      <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
        <NativeSelect
          id={id}
          value={value}
          options={options}
          onChange={handleChange}
          className="bg-card"
        />
      </div>
    </div>
  );
}
