import { useTranslation } from "react-i18next";
import { ToggleGroup } from "@/shared/ui/toggle-group";
import { MODERATION_TAB_LABEL_KEYS } from "@/features/moderation/lib/moderation-label-keys";
import {
  MODERATION_TABS,
  type ModerationTab,
} from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationTabsProps {
  value: ModerationTab;
  /** Shown next to "Pending" so the queue length is visible from the other tabs too. */
  pendingCount: number | null;
  onChange: (tab: ModerationTab) => void;
}

function isModerationTab(value: string | undefined): value is ModerationTab {
  return MODERATION_TABS.some((tab) => tab === value);
}

export function ModerationTabs({ value, pendingCount, onChange }: ModerationTabsProps) {
  const { t } = useTranslation();
  // Pressing the chosen tab again would clear the group; that is not a tab change.
  const handleChange = (next: string[]) => {
    if (isModerationTab(next[0])) onChange(next[0]);
  };

  return (
    <ToggleGroup
      aria-label={t("moderation.tabs.label")}
      value={[value]}
      onValueChange={handleChange}
      className="w-fit gap-1 rounded-xl bg-muted p-1"
    >
      {MODERATION_TABS.map((tab) => (
        <ToggleGroup.Item
          key={tab}
          value={tab}
          className="h-8 rounded-lg border-transparent bg-transparent px-3 text-sm hover:bg-transparent data-pressed:border-transparent data-pressed:shadow-sm"
        >
          {tab === "pending" && pendingCount !== null
            ? t("moderation.tabs.pendingCount", { count: pendingCount })
            : t(MODERATION_TAB_LABEL_KEYS[tab])}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup>
  );
}
