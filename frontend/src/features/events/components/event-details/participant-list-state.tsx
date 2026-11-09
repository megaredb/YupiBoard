import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ListState } from "@/shared/lib/list-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

interface ParticipantListStateProps<T> {
  state: ListState<T>;
  emptyText: string;
  renderItem: (item: T) => ReactNode;
}

const SKELETON_ROWS = 3;

/** Loading, error, empty and data states of a participant list (UI-7). */
export function ParticipantListState<T>({
  state,
  emptyText,
  renderItem,
}: ParticipantListStateProps<T>) {
  const { t } = useTranslation();

  if (state.status === "pending") {
    return (
      <div aria-busy className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <Skeleton key={index} className="h-17 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm">
        <span>{t("common.loadFailed")}</span>
        <Button variant="outline" size="lg" onClick={state.retry}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }
  if (state.items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        {emptyText}
      </p>
    );
  }
  return <ul className="space-y-2">{state.items.map(renderItem)}</ul>;
}
