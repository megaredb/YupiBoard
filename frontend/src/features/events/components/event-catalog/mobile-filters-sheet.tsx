import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { CatalogFilterFields } from "@/features/events/components/event-catalog/catalog-filter-fields";
import { useCatalogResultCount } from "@/features/events/hooks/use-catalog-result-count";
import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from "@/features/events/schemas/catalog-search.schema";

interface MobileFiltersSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
}

/** Phone filters: edits a draft and shows the live result count on the apply button. */
export function MobileFiltersSheet({
  isOpen,
  onOpenChange,
  value,
  onApply,
}: MobileFiltersSheetProps) {
  const { t } = useTranslation();
  const handleApply = (next: CatalogFilters) => {
    onApply(next);
    onOpenChange(false);
  };

  return (
    <BottomSheet
      open={isOpen}
      onOpenChange={onOpenChange}
      title={t("events.filters.title")}
      closeLabel={t("common.close")}
    >
      {/* Mounted per opening so the draft always starts from the applied filters. */}
      {isOpen && <FiltersDraft initial={value} onApply={handleApply} />}
    </BottomSheet>
  );
}

function FiltersDraft({
  initial,
  onApply,
}: {
  initial: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(initial);
  const resultCount = useCatalogResultCount(draft);
  const handleClear = () => setDraft(DEFAULT_CATALOG_FILTERS);
  const handleApply = () => onApply(draft);

  return (
    <div className="space-y-6">
      <CatalogFilterFields value={draft} onChange={setDraft} />
      <div className="flex gap-3 border-t pt-4">
        <Button variant="outline" size="xl" className="flex-1" onClick={handleClear}>
          {t("events.filters.clearAll")}
        </Button>
        <Button size="xl" className="flex-[1.5]" onClick={handleApply}>
          {resultCount === null
            ? t("events.filters.show")
            : t("events.filters.showResults", { count: resultCount })}
        </Button>
      </div>
    </div>
  );
}
