import { useState } from "react";
import { Slider } from "@/shared/ui/slider";

interface RangeSliderProps {
  label: string;
  /** Text shown next to the label for the current value, e.g. "Within 15 km". */
  formatValue: (value: number) => string;
  /** Text under the track ends, e.g. "1 km". */
  formatBound: (value: number) => string;
  min: number;
  max: number;
  /** Initial position; remount with a new `key` to reset it from outside. */
  value: number;
  /** Called when the user releases the thumb (or key), not on every tick. */
  onCommit: (value: number) => void;
}

export function RangeSlider({
  label,
  formatValue,
  formatBound,
  min,
  max,
  value,
  onCommit,
}: RangeSliderProps) {
  const [draft, setDraft] = useState(value);
  const handleCommit = (next: number) => {
    if (next !== value) onCommit(next);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs font-medium text-primary">{formatValue(draft)}</span>
      </div>
      <Slider
        thumbLabels={[label]}
        min={min}
        max={max}
        value={draft}
        onValueChange={setDraft}
        onValueCommitted={handleCommit}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{formatBound(min)}</span>
        <span>{formatBound(max)}</span>
      </div>
    </div>
  );
}
