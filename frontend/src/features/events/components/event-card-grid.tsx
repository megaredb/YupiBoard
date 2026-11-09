import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import type { ListState } from "@/shared/lib/list-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusMessage } from "@/shared/ui/status-message";

interface EventCardGridProps<T> {
  state: ListState<T>;
  empty: { title: string; description: string };
  renderCard: (item: T) => ReactNode;
  isRefreshing?: boolean;
}

const GRID_CLASS = "grid w-full grid-cards gap-4";
const SKELETON_COUNT = 6;

function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      <Skeleton className="aspect-16/10 w-full rounded-none" />
      <div className="space-y-3 p-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/5" />
      </div>
    </div>
  );
}

export function EventCardGrid<T>({
  state,
  empty,
  renderCard,
  isRefreshing = false,
}: EventCardGridProps<T>) {
  const { t } = useTranslation();

  if (state.status === "error") {
    return (
      <StatusMessage
        title={t("common.loadFailed")}
        action={
          <Button variant="outline" onClick={state.retry}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }

  if (state.status === "pending") {
    return (
      <div aria-busy className={GRID_CLASS}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <EventCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (state.items.length === 0) {
    return <StatusMessage title={empty.title} description={empty.description} />;
  }

  return (
    <div className={cn(GRID_CLASS, "transition-opacity", isRefreshing && "opacity-60")}>
      {state.items.map(renderCard)}
    </div>
  );
}
