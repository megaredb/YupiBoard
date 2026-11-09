import type { ReactNode } from "react";

interface FilterSectionProps {
  /** Omitted when the control brings its own label or legend. */
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function FilterSection({ title, action, children }: FilterSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      {title && (
        <div className="flex min-h-6 items-center justify-between gap-2">
          <h3 className="text-sm font-medium">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
