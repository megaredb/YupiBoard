import { useId, type ComponentProps } from "react"
import { Input } from "@/components/ui/input"

interface FormFieldProps extends ComponentProps<typeof Input> {
  label: string
  error?: string
}

export function FormField({ label, error, ...inputProps }: FormFieldProps) {
  const id = useId()
  const errorId = `${id}-description`

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
