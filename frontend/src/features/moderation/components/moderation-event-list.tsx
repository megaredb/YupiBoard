import { BadgeCheck, Dices } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ModerationEventRead } from "@/shared/api/generated/model";
import { cn } from "@/shared/lib/cn";
import type { ListState } from "@/shared/lib/list-state";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { StatusMessage } from "@/shared/ui/status-message";
import { ModerationEventRow } from "@/features/moderation/components/moderation-event-row";
import { MODERATION_EMPTY_KEYS } from "@/features/moderation/lib/moderation-label-keys";
import type { ModerationTab } from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationEventListProps {
  state: ListState<ModerationEventRead>;
  tab: ModerationTab;
  /** Whether a search narrowed the list down, which changes what "empty" means. */
  isSearching: boolean;
  isRefreshing: boolean;
}

const SKELETON_COUNT = 4;
const LIST_CLASS = "space-y-3";

function EmptyState({ tab, isSearching }: Pick<ModerationEventListProps, "tab" | "isSearching">) {
  const { t } = useTranslation();

  if (isSearching) {
    return (
      <StatusMessage
        icon={<Dices aria-hidden className="size-12 stroke-[1.5]" />}
        title={t("moderation.empty.noMatchTitle")}
        description={t("moderation.empty.noMatchDescription")}
      />
    );
  }

  return (
    <StatusMessage
      icon={<BadgeCheck aria-hidden className="size-12 stroke-[1.5]" />}
      title={t(MODERATION_EMPTY_KEYS[tab].title)}
      description={t(MODERATION_EMPTY_KEYS[tab].description)}
    />
  );
}

export function ModerationEventList({
  state,
  tab,
  isSearching,
  isRefreshing,
}: ModerationEventListProps) {
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
      <ul aria-busy className={LIST_CLASS}>
        {Array.from({ length: SKELETON_COUNT }, (_, index) => (
          <li key={index}>
            <Skeleton className="h-28 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    );
  }

  if (state.items.length === 0) return <EmptyState tab={tab} isSearching={isSearching} />;

  return (
    <ul className={cn(LIST_CLASS, "transition-opacity", isRefreshing && "opacity-60")}>
      {state.items.map((event) => (
        <ModerationEventRow key={event.id} event={event} tab={tab} />
      ))}
    </ul>
  );
}
