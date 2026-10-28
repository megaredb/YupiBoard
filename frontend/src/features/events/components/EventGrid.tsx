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
        'grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3',
        className,
      )}
    >
      {children}
    </div>
  )
} 