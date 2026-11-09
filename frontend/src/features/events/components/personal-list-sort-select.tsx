import { useTranslation } from "react-i18next";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { LabeledSelect } from "@/features/events/components/labeled-select";
import {
  PERSONAL_LIST_SORTS,
  type PersonalListSort,
} from "@/features/events/schemas/personal-list-search.schema";

interface PersonalListSortSelectProps {
  value: PersonalListSort;
  /** What "date" means differs per list (event start or booking time), so labels come in. */
  labelKeys: Record<PersonalListSort, TranslationKey>;
  onChange: (sort: PersonalListSort) => void;
}

function isPersonalListSort(value: string): value is PersonalListSort {
  return PERSONAL_LIST_SORTS.some((sort) => sort === value);
}

export function PersonalListSortSelect({
  value,
  labelKeys,
  onChange,
}: PersonalListSortSelectProps) {
  const { t } = useTranslation();
  const options = PERSONAL_LIST_SORTS.map((sort) => ({ value: sort, label: t(labelKeys[sort]) }));
  const handleChange = (next: string) => {
    if (isPersonalListSort(next)) onChange(next);
  };

  return (
    <LabeledSelect
      label={t("events.sort.label")}
      value={value}
      options={options}
      onChange={handleChange}
    />
  );
}
