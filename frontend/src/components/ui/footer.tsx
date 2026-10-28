import { cn } from '../../lib/utils'

export interface FooterProps {
  brandName?: string
  copyright: string
  className?: string
}

export function Footer({ brandName, copyright, className }: FooterProps) {
  return (
    <footer className={cn('border-t border-border bg-background', className)}>
      <div className="flex w-full items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-10 xl:px-16">
        {brandName && (
          <div className="flex items-center gap-2 font-semibold text-foreground">
            <img src="/images/logo.svg" alt="" className="size-5" />
            <span>{brandName}</span>
          </div>
        )}
        <span>{copyright}</span>
      </div>
    </footer>
  )
}
