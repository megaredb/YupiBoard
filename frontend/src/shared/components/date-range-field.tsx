import { useId, type ChangeEvent } from "react";
import { InputGroup } from "@/shared/ui/input-group";
import { Label } from "@/shared/ui/label";

/** ISO dates ("2026-11-07"); an empty bound is `undefined`. */
export interface DateRange {
  from: string | undefined;
  to: string | undefined;
}

interface DateRangeFieldProps {
  fromLabel: string;
  toLabel: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  min?: string;
}

interface DateBoundProps {
  label: string;
  value: string | undefined;
  min: string | undefined;
  max: string | undefined;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/** One labelled native date input; the label sits inside the field so narrow panels never clip the date. */
function DateBound({ label, value, min, max, onChange }: DateBoundProps) {
  const id = useId();
  return (
    <InputGroup>
      <InputGroup.Addon>
        <Label htmlFor={id} className="w-8 text-xs font-normal text-muted-foreground">
          {label}
        </Label>
      </InputGroup.Addon>
      <InputGroup.Input
        id={id}
        type="date"
        min={min}
        max={max}
        value={value ?? ""}
        onChange={onChange}
        className="pr-3"
      />
    </InputGroup>
  );
}

/** Two native date inputs (the OS picker on phones); "to" cannot be set before "from". */
export function DateRangeField({ fromLabel, toLabel, value, onChange, min }: DateRangeFieldProps) {
  const handleFromChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, from: event.target.value || undefined });
  const handleToChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, to: event.target.value || undefined });

  return (
    <div className="space-y-2">
      <DateBound
        label={fromLabel}
        value={value.from}
        min={min}
        max={value.to}
        onChange={handleFromChange}
      />
      <DateBound
        label={toLabel}
        value={value.to}
        min={value.from ?? min}
        max={undefined}
        onChange={handleToChange}
      />
    </div>
  );
}
