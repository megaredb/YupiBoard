import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface BreadcrumbItem {
  label: string;
  /** Omit for the current (last) crumb. */
  to?: "/events";
}

interface BreadcrumbsProps {
  label: string;
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ label, items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={cn("text-xs text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={item.label} className="flex min-w-0 items-center gap-1.5">
            {index > 0 && <ChevronRight aria-hidden className="size-3.5 shrink-0" />}
            {item.to ? (
              <Link to={item.to} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
