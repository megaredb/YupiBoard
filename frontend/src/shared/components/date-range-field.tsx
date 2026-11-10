import { useId } from "react";
import { useTranslation } from "react-i18next";
import { DatePicker } from "@/shared/ui/date-picker";
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
  onChange: (isoDate: string) => void;
}

function DateBound({ label, value, min, max, onChange }: DateBoundProps) {
  const id = useId();
  const { i18n } = useTranslation();
  return (
    <InputGroup>
      <InputGroup.Addon>
        <Label htmlFor={id} className="w-8 text-xs font-normal text-muted-foreground">
          {label}
        </Label>
      </InputGroup.Addon>
      <DatePicker
        id={id}
        variant="group"
        allowClear
        locale={i18n.language}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={onChange}
      />
    </InputGroup>
  );
}

/** Two custom date pickers; "to" cannot be set before "from". */
export function DateRangeField({ fromLabel, toLabel, value, onChange, min }: DateRangeFieldProps) {
  const handleFromChange = (iso: string) => onChange({ ...value, from: iso || undefined });
  const handleToChange = (iso: string) => onChange({ ...value, to: iso || undefined });

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
