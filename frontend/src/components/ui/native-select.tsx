import type { ComponentProps, ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NativeSelectOption {
  value: string
  label: string
}

export interface NativeSelectProps extends Omit<ComponentProps<"select">, "children"> {
  options: NativeSelectOption[]
  startIcon?: ReactNode
  variant?: "default" | "tinted" | "ghost"
}

const variants = {
  default: "border border-input bg-transparent text-foreground",
  tinted: "bg-primary/10 font-medium text-primary",
  ghost: "bg-transparent font-medium text-foreground",
} as const

/** Styled native `<select>`: keeps the OS picker on mobile. */
export function NativeSelect({
  options,
  startIcon,
  variant = "default",
  className,
  ...props
}: NativeSelectProps) {
  return (
    <div className="relative">
      {startIcon && (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 [&_svg]:size-4",
            variant === "tinted" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {startIcon}
        </span>
      )}
      <select
        className={cn(
          "h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg pr-8 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive",
          startIcon ? "pl-9" : "pl-3",
          variants[variant],
          className,
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2",
          variant === "tinted" ? "text-primary" : "text-muted-foreground",
        )}
      />
    </div>
  )
}

