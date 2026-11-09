import { BrandLogo } from "@/shared/layout/brand-logo";
import { cn } from "@/shared/lib/cn";

interface FooterProps {
  copyright: string;
  className?: string;
}

export function Footer({ copyright, className }: FooterProps) {
  return (
    <footer className={cn("border-t border-border bg-background pb-safe", className)}>
      <div className="flex w-full items-center justify-between gap-4 px-4 py-6 text-xs text-muted-foreground sm:px-6 lg:px-10 xl:px-16">
        <BrandLogo size="xs" />
        <span>{copyright}</span>
      </div>
    </footer>
  );
}
