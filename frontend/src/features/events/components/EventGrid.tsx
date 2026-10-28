import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EventGridProps extends Omit<ComponentProps<"div">, "children" | "className"> {
  children: ReactNode
  className?: string
}

export function EventGrid({ children, className, ...props }: EventGridProps) {
  return (
    <div
      {...props}
      className={cn(
        'grid w-full grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4',
        className,
      )}
    >
      {children}
    </div>
  )
} 