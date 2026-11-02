import type { ReactNode } from "react"

interface DetailsRowProps {
  label: string
  note?: string
  children: ReactNode
}

/** One `dt`/`dd` pair of a profile `dl`. */
export function DetailsRow({ label, note, children }: DetailsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
      <dt className="text-muted-foreground">
        {label}
        {note && <span className="block text-xs text-muted-foreground/70">{note}</span>}
      </dt>
      <dd className="text-foreground sm:col-span-2">{children}</dd>
    </div>
  )
}
