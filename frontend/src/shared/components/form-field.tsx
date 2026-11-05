import { useId, type ReactNode } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Label } from "@/shared/ui/label";

/** Attributes the wrapped control spreads onto itself. */
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
  /** Right-aligned note under the control, e.g. `"42/2000"`. */
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
        <span aria-hidden className="text-primary">
          {"*"}
        </span>
      )}
      {optionalText && (
        <span className="text-xs font-normal text-muted-foreground">{optionalText}</span>
      )}
    </Label>
  );
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
      <CircleAlert aria-hidden className="size-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/** Label, control, hint and error wired together through `id` / `aria-describedby` (FORM-5). */
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
      {error && <FieldError id={errorId} message={error} />}
    </div>
  );
}
