import { formatCountryName } from "@/shared/lib/format/format-region";
import type { NativeSelectOption } from "@/shared/ui/native-select";
import { useCities } from "@/features/locations/hooks/use-cities";

/** "Київ, Україна"; the value is the English city name, which is what the API stores. */
export function useCityOptions(): NativeSelectOption[] {
  return useCities().map((city) => ({
    value: city.canonical_name,
    label: [city.name, formatCountryName(city.country_code)].join(", "),
  }));
}
