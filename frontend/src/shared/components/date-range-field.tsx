import { useId, type ChangeEvent } from "react";
import { Input } from "@/shared/ui/input";
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

/** Two native date inputs (the OS picker on phones); "to" cannot be set before "from". */
export function DateRangeField({ fromLabel, toLabel, value, onChange, min }: DateRangeFieldProps) {
  const fromId = useId();
  const toId = useId();
  const handleFromChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, from: event.target.value || undefined });
  const handleToChange = (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, to: event.target.value || undefined });

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="min-w-0 space-y-1">
        <Label htmlFor={fromId} className="text-xs text-muted-foreground">
          {fromLabel}
        </Label>
        <Input
          id={fromId}
          type="date"
          min={min}
          max={value.to}
          value={value.from ?? ""}
          onChange={handleFromChange}
          className="px-2"
        />
      </div>
      <div className="min-w-0 space-y-1">
        <Label htmlFor={toId} className="text-xs text-muted-foreground">
          {toLabel}
        </Label>
        <Input
          id={toId}
          type="date"
          min={value.from ?? min}
          value={value.to ?? ""}
          onChange={handleToChange}
          className="px-2"
        />
      </div>
    </div>
  );
}
