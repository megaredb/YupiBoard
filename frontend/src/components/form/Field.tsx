import { useId, type ReactNode } from "react"

interface ControlProps {
  id: string
  "aria-invalid": true | undefined
  "aria-describedby": string | undefined
}

interface FieldProps {
  label: string
  required?: boolean
  hint?: ReactNode
  error?: string
  /** Right-aligned helper, e.g. a "12/2000" counter. */
  counter?: ReactNode
  /** Render prop so the label, hint and error are wired to the control for a11y. */
  children: (control: ControlProps) => ReactNode
  className?: string
}

/** Label + control + hint/error row. Control-agnostic (input, textarea, stepper, ...). */
export function Field({ label, required, hint, error, counter, children, className }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const hasFooter = Boolean(error || hint || counter)

  return (
    <div className={className ?? "space-y-1.5"}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
        {required && <span className="text-primary"> *</span>}
      </label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? errorId : hint ? hintId : undefined,
      })}
      {hasFooter && (
        <div className="flex items-start justify-between gap-3 text-xs text-muted-foreground">
          {error ? (
            <p id={errorId} role="alert" className="text-destructive">
              {error}
            </p>
          ) : (
            <p id={hintId}>{hint}</p>
          )}
          {counter && <span className="shrink-0">{counter}</span>}
        </div>
      )}
    </div>
  )
}
