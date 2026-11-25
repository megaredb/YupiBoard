import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FieldControlProps } from "@/shared/components/form-field";
import { formatCountryName } from "@/shared/lib/format/format-region";
import { Combobox } from "@/shared/ui/combobox";
import { useCities } from "@/features/locations/hooks/use-cities";
import { useCitySearch, type CitySearch } from "@/features/locations/hooks/use-city-search";
import { findCityByName } from "@/features/locations/lib/find-city";

// Base UI reports typing in the input with this change reason.
const INPUT_CHANGE = "input-change";

const EMPTY_TEXT_KEYS = {
  searching: "common.city.searching",
  unavailable: "common.city.unavailable",
  ready: "common.city.noResults",
} as const satisfies Record<CitySearch["status"], string>;

interface CityComboboxProps {
  fieldControl: FieldControlProps;
  /** The city's English name, which is what the API stores; `""` when none is picked. */
  value: string;
  onValueChange: (city: string) => void;
  onBlur?: () => void;
  startIcon?: ReactNode;
  variant?: "default" | "tinted" | "ghost";
  /** Lets the user remove the city (an optional field). */
  isClearable?: boolean;
  disabled?: boolean;
}

export function CityCombobox({
  fieldControl,
  value,
  onValueChange,
  onBlur,
  startIcon,
  variant,
  isClearable = false,
  disabled,
}: CityComboboxProps) {
  const { t } = useTranslation();
  const cities = useCities();
  const [query, setQuery] = useState("");
  const search = useCitySearch(query);
  const items = search.status === "ready" ? search.cities.map((city) => city.canonical_name) : [];

  // A stored name the backend no longer lists is shown as it is.
  const toLabel = (name: string) => findCityByName(cities, name)?.name ?? name;
  const toCountry = (name: string) => {
    const city = findCityByName(cities, name);
    return city ? formatCountryName(city.country_code) : null;
  };

  // Only typed text is a search; the input showing the picked city lists every city.
  const handleInputValueChange = (text: string, details: { reason: string }) =>
    setQuery(details.reason === INPUT_CHANGE ? text : "");
  const handleValueChange = (next: string | null) => {
    if (next || isClearable) onValueChange(next ?? "");
  };

  return (
    <Combobox
      items={items}
      value={value || null}
      onValueChange={handleValueChange}
      onInputValueChange={handleInputValueChange}
      itemToStringLabel={toLabel}
      filter={null}
      autoHighlight
      disabled={disabled}
    >
      <Combobox.Field
        {...fieldControl}
        onBlur={onBlur}
        variant={variant}
        startIcon={startIcon}
        placeholder={t("common.city.placeholder")}
        toggleLabel={t("common.city.showSuggestions")}
        clearLabel={isClearable && value ? t("common.city.clear") : undefined}
      />
      <Combobox.Content>
        <Combobox.Empty>{t(EMPTY_TEXT_KEYS[search.status])}</Combobox.Empty>
        <Combobox.List>
          {(name: string) => (
            <Combobox.Item key={name} value={name}>
              <span className="min-w-0">
                <span className="block truncate">{toLabel(name)}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {toCountry(name)}
                </span>
              </span>
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Content>
    </Combobox>
  );
}
