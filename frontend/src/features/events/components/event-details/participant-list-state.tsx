import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { ListState } from "@/shared/lib/list-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusMessage } from "@/shared/ui/status-message";

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
      <StatusMessage
        size="compact"
        title={t("common.loadFailed")}
        action={
          <Button variant="outline" size="lg" onClick={state.retry}>
            {t("common.retry")}
          </Button>
        }
      />
    );
  }
  if (state.items.length === 0) return <StatusMessage size="compact" title={emptyText} />;
  return <ul className="space-y-2">{state.items.map(renderItem)}</ul>;
}
