import type { ComponentProps, ReactNode } from "react"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"
import { cn } from "@/shared/lib/cn"

export interface NativeSelectOption {
  value: string
  label: string
}

type NativeSelectVariant = "default" | "tinted" | "ghost"

interface NativeSelectProps extends Omit<ComponentProps<"select">, "children"> {
  options: NativeSelectOption[]
  startIcon?: ReactNode
  variant?: NativeSelectVariant
}

const selectVariants = cva(
  "h-11 w-full min-w-0 cursor-pointer appearance-none rounded-lg pr-8 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border border-input bg-transparent text-foreground",
        tinted: "bg-primary/10 font-medium text-primary",
        ghost: "bg-transparent font-medium text-foreground",
      },
      hasIcon: { true: "pl-9", false: "pl-3" },
    },
  },
)

const iconVariants = cva("pointer-events-none absolute top-1/2 -translate-y-1/2", {
  variants: {
    variant: {
      default: "text-muted-foreground",
      tinted: "text-primary",
      ghost: "text-muted-foreground",
    },
  },
})

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
        <span aria-hidden className={cn(iconVariants({ variant }), "left-3 [&_svg]:size-4")}>
          {startIcon}
        </span>
      )}
      <select
        className={cn(selectVariants({ variant, hasIcon: Boolean(startIcon) }), className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className={cn(iconVariants({ variant }), "right-3 size-4")} />
    </div>
  )
}
