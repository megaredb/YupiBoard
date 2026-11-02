import type { ComponentProps } from "react"
import { cn } from "@/shared/lib/cn"

interface LabelProps extends ComponentProps<"label"> {
  htmlFor: string
}

export function Label({ className, htmlFor, ...props }: LabelProps) {
  return (
    <label
      data-slot="label"
      htmlFor={htmlFor}
      className={cn(
        "flex items-center gap-1.5 text-sm leading-none font-medium select-none group-data-disabled:pointer-events-none group-data-disabled:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}
