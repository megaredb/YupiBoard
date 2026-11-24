import { useTranslation } from "react-i18next";
import { LabeledSelect } from "@/features/events";
import { MODERATION_SORT_LABEL_KEYS } from "@/features/moderation/lib/moderation-label-keys";
import {
  MODERATION_SORTS,
  type ModerationSort,
} from "@/features/moderation/schemas/moderation-search.schema";

interface ModerationSortSelectProps {
  value: ModerationSort;
  onChange: (sort: ModerationSort) => void;
}

function isModerationSort(value: string): value is ModerationSort {
  return MODERATION_SORTS.some((sort) => sort === value);
}

export function ModerationSortSelect({ value, onChange }: ModerationSortSelectProps) {
  const { t } = useTranslation();
  const options = MODERATION_SORTS.map((sort) => ({
    value: sort,
    label: t(MODERATION_SORT_LABEL_KEYS[sort]),
  }));
  const handleChange = (next: string) => {
    if (isModerationSort(next)) onChange(next);
  };

  return (
    <LabeledSelect
      label={t("admin.moderation.sort.label")}
      value={value}
      options={options}
      onChange={handleChange}
    />
  );
}
