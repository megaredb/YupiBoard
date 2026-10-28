import type { ReactNode } from 'react'

import { cn } from '../../lib/utils'

export interface EventGridProps {
  children: ReactNode
  className?: string
}

export function EventGrid({ children, className }: EventGridProps) {
  return (
    <div
      className={cn(
        'grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4',
        className,
      )}
    >
      {children}
    </div>
  )
} 