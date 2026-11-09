import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Input } from "@/shared/ui/input";
import { Slider } from "@/shared/ui/slider";

type Range = readonly [number, number];

interface RangeFieldProps {
  label: string;
  /** Accessible names of the lower and upper bound (inputs and thumbs). */
  boundLabels: readonly [string, string];
  min: number;
  max: number;
  step: number;
  /** Initial range; remount with a new `key` to reset it from outside. */
  value: Range;
  onCommit: (value: Range) => void;
  /** Shown inside both inputs, e.g. "₴". */
  prefix?: string;
}

function clampRange([low, high]: Range, min: number, max: number): Range {
  const lower = Math.min(Math.max(low, min), max);
  return [lower, Math.min(Math.max(high, lower), max)];
}

function toRange(values: readonly number[], fallback: Range): Range {
  return [values[0] ?? fallback[0], values[1] ?? fallback[1]];
}

const BOUNDS = [0, 1] as const;

/** Two number inputs and a two-thumb slider editing the same range. */
export function RangeField({
  label,
  boundLabels,
  min,
  max,
  step,
  value,
  onCommit,
  prefix,
}: RangeFieldProps) {
  const [draft, setDraft] = useState<Range>(value);

  const commit = (next: Range) => {
    const clamped = clampRange(next, min, max);
    setDraft(clamped);
    if (clamped[0] !== value[0] || clamped[1] !== value[1]) onCommit(clamped);
  };
  const handleInput = (index: 0 | 1, event: ChangeEvent<HTMLInputElement>) => {
    const number = Number(event.target.value);
    setDraft(index === 0 ? [number, draft[1]] : [draft[0], number]);
  };
  const handleInputCommit = () => commit(draft);
  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") commit(draft);
  };
  const handleSliderChange = (next: readonly number[]) => setDraft(toRange(next, draft));
  const handleSliderCommit = (next: readonly number[]) => commit(toRange(next, draft));

  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex items-center gap-2">
        {BOUNDS.map((index) => (
          <div key={index} className="relative flex-1">
            {prefix && (
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
              >
                {prefix}
              </span>
            )}
            <Input
              type="number"
              inputMode="numeric"
              aria-label={boundLabels[index]}
              min={min}
              max={max}
              step={step}
              value={draft[index]}
              onChange={(event) => handleInput(index, event)}
              onBlur={handleInputCommit}
              onKeyDown={handleInputKeyDown}
              className={prefix ? "pl-7" : undefined}
            />
          </div>
        ))}
      </div>
      <Slider
        thumbLabels={boundLabels}
        min={min}
        max={max}
        step={step}
        value={draft}
        onValueChange={handleSliderChange}
        onValueCommitted={handleSliderCommit}
      />
    </fieldset>
  );
}
