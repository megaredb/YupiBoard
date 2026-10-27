import { cn } from '../../lib/utils'

export interface FooterProps {
  copyright: string
  className?: string
}

export function Footer({ copyright, className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="w-full px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-10 xl:px-16">
        {copyright}
      </div>
    </footer>
  )
} 