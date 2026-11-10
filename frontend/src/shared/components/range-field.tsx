import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { InputGroup } from "@/shared/ui/input-group";
import { Slider } from "@/shared/ui/slider";

type Range = readonly [number, number];

interface RangeFieldProps {
  label: string;
  boundLabels: readonly [string, string];
  min: number;
  max: number;
  step: number;
  /** Initial range; remount with a new `key` to reset it from outside. */
  value: Range;
  onCommit: (value: Range) => void;
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
          <InputGroup key={index} className="flex-1">
            {prefix && <InputGroup.Addon aria-hidden>{prefix}</InputGroup.Addon>}
            <InputGroup.Input
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
            />
          </InputGroup>
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
