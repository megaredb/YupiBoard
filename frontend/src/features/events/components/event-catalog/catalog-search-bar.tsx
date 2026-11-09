import { useId, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { SearchField } from "@/shared/components/search-field";
import { Label } from "@/shared/ui/label";
import { NativeSelect } from "@/shared/ui/native-select";
import {
  CATALOG_SORTS,
  SEARCH_QUERY_MAX_LENGTH,
  type CatalogFilters,
  type CatalogSort,
} from "@/features/events/schemas/catalog-search.schema";

interface CatalogSearchBarProps {
  value: CatalogFilters;
  onApply: (next: CatalogFilters) => void;
}

const SORT_LABEL_KEYS = {
  "distance-asc": "events.sort.distanceAsc",
  "distance-desc": "events.sort.distanceDesc",
  "date-asc": "events.sort.dateAsc",
  "date-desc": "events.sort.dateDesc",
  "cost-asc": "events.sort.costAsc",
  "cost-desc": "events.sort.costDesc",
} as const satisfies Record<CatalogSort, string>;

function isCatalogSort(value: string): value is CatalogSort {
  return CATALOG_SORTS.some((sort) => sort === value);
}

/** Title search and sort order above the event grid. */
export function CatalogSearchBar({ value, onApply }: CatalogSearchBarProps) {
  const { t } = useTranslation();
  const sortId = useId();
  const sortOptions = CATALOG_SORTS.map((sort) => ({
    value: sort,
    label: t(SORT_LABEL_KEYS[sort]),
  }));

  const handleSearch = (query: string) => onApply({ ...value, q: query || undefined });
  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const sort = event.target.value;
    if (isCatalogSort(sort)) onApply({ ...value, sort });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchField
        key={value.q ?? ""}
        label={t("events.search.label")}
        placeholder={t("events.search.placeholder")}
        submitLabel={t("events.search.submit")}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        defaultValue={value.q ?? ""}
        onSearch={handleSearch}
      />
      <div className="flex items-center gap-2">
        <Label htmlFor={sortId} className="shrink-0 text-sm text-muted-foreground">
          {t("events.sort.label")}
        </Label>
        <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <NativeSelect
            id={sortId}
            options={sortOptions}
            value={value.sort}
            onChange={handleSortChange}
            className="bg-card"
          />
        </div>
      </div>
    </div>
  );
}
