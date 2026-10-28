import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

const WIDTHS = {
  narrow: "max-w-3xl",
  default: "max-w-5xl",
  wide: "max-w-[1440px]",
} as const

interface PageContainerProps {
  size?: keyof typeof WIDTHS
  className?: string
  children: ReactNode
}

/** Centered content column with the standard horizontal padding. */
export function PageContainer({ size = "default", className, children }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 md:py-8 lg:px-10", WIDTHS[size], className)}>
      {children}
    </div>
  )
}
