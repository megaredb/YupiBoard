import { useId, type ReactNode } from "react";
import { InlineError } from "@/shared/components/inline-error";
import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";

export interface FieldControlProps {
  id: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

interface FormFieldProps {
  label: string;
  isRequired?: boolean;
  optionalText?: string;
  hint?: string;
  error?: string;
  counter?: string;
  isLabelHidden?: boolean;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
}

type FieldLabelProps = Pick<
  FormFieldProps,
  "label" | "isRequired" | "optionalText" | "isLabelHidden"
>;

function FieldLabel({
  id,
  label,
  isRequired,
  optionalText,
  isLabelHidden,
}: FieldLabelProps & { id: string }) {
  return (
    <Label htmlFor={id} className={cn("text-sm text-foreground", isLabelHidden && "sr-only")}>
      <span>{label}</span>
      {isRequired && (
        <span aria-hidden className="text-destructive">
          {"*"}
        </span>
      )}
      {optionalText && (
        <>
          {/* Keeps "City Optional" two words for screen readers; the gap is visual only. */}
          <span className="sr-only"> </span>
          <span className="text-xs font-normal text-muted-foreground">{optionalText}</span>
        </>
      )}
    </Label>
  );
}

export function FormField({
  hint,
  error,
  counter,
  className,
  children,
  ...labelProps
}: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const visibleHint = error ? undefined : hint;

  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel id={id} {...labelProps} />
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : visibleHint && hintId,
      })}
      {(visibleHint || counter) && (
        <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
          <p id={hintId}>{visibleHint}</p>
          {counter && <span className="shrink-0 tabular-nums">{counter}</span>}
        </div>
      )}
      {error && <InlineError id={errorId} message={error} />}
    </div>
  );
}
