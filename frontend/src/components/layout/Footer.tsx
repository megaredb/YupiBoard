import { cn } from '@/lib/utils'

export interface FooterProps {
  copyright: string
  brandName: string
  className?: string
}

export function Footer({ copyright, brandName, className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="flex w-full items-center justify-between gap-4 px-4 py-6 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <img src="/images/logo.svg" alt="" aria-hidden="true" className="size-6" />
          <span>{brandName}</span>
        </div>
        <p className="text-right text-xs text-muted-foreground">{copyright}</p>
      </div>
    </footer>
  )
}