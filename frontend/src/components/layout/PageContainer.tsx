import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: ReactNode
  size?: "narrow" | "default" | "wide"
  className?: string
}

const maxWidth = {
  narrow: "max-w-2xl",
  default: "max-w-5xl",
  wide: "max-w-7xl",
} as const

/** Centered horizontal padding + max-width used by every app page. */
export function PageContainer({ children, size = "default", className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-6 sm:px-6 lg:px-10", maxWidth[size], className)}>
      {children}
    </div>
  )
}

