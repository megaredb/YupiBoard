import type { ReactNode } from "react"
import { cn } from "@/shared/lib/cn"

interface HeaderProps {
  children: ReactNode
  className?: string
}

/** Sticky top bar of the app shell; its content is composed by the caller. */
export function Header({ children, className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/95 pt-safe backdrop-blur supports-backdrop-filter:bg-background/80",
        className,
      )}
    >
      <div className="flex h-14 w-full items-center gap-2 px-4 sm:px-6">{children}</div>
    </header>
  )
}
