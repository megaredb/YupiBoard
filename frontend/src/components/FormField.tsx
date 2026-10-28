import { useId, useState, type ComponentProps, type ReactNode } from "react"
import { CircleAlert, Eye, EyeOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface FormFieldProps extends ComponentProps<typeof Input> {
  label: string
  error?: string
  helperText?: string
  requiredIndicator?: boolean
  optionalText?: string
  startIcon?: ReactNode
  endAdornment?: ReactNode
  showPasswordToggle?: boolean
}

export function FormField({
  label,
  error,
  helperText,
  requiredIndicator,
  optionalText,
  startIcon,
  endAdornment,
  showPasswordToggle,
  type,
  className,
  id: providedId,
  ...inputProps
}: FormFieldProps) {
  const { t } = useTranslation()
  const generatedId = useId()
  const id = providedId ?? generatedId
  const errorId = `${id}-error`
  const helperId = `${id}-helper`

  const isPassword = type === "password"
  const canTogglePassword = showPasswordToggle ?? isPassword
  const [passwordVisible, setPasswordVisible] = useState(false)

  const effectiveType = isPassword && passwordVisible ? "text" : type

  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        <span>{label}</span>
        {requiredIndicator && (
          <span className="text-primary" aria-hidden="true">
            *
          </span>
        )}
        {optionalText && (
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            {optionalText}
          </span>
        )}
      </Label>

      <div className="relative flex items-center">
        {startIcon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 flex items-center text-muted-foreground [&_svg]:size-4"
          >
            {startIcon}
          </span>
        )}

        <Input
          id={id}
          type={effectiveType}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            startIcon && "pl-9",
            (canTogglePassword || endAdornment) && "pr-10",
            className
          )}
          {...inputProps}
        />

        {canTogglePassword && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-pressed={passwordVisible}
            aria-label={
              passwordVisible
                ? t("common.hidePassword", "Hide password")
                : t("common.showPassword", "Show password")
            }
            onClick={() => setPasswordVisible((prev) => !prev)}
            className="absolute right-1.5 text-muted-foreground hover:bg-transparent hover:text-foreground"
            tabIndex={-1}
          >
            {passwordVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        )}

        {!canTogglePassword && endAdornment && (
          <div className="absolute right-2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {helperText && !error && (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}
