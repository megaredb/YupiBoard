import type { ComponentProps } from "react";
import { NativeSelect } from "@/shared/ui/native-select";
import { useCityOptions } from "@/features/locations/hooks/use-city-options";

interface CitySelectProps extends Omit<ComponentProps<typeof NativeSelect>, "options"> {
  emptyLabel?: string;
  /** A stored value the backend no longer lists (e.g. typed before cities existed); kept selectable. */
  legacyValue?: string | null;
}

export function CitySelect({ emptyLabel, legacyValue, ...props }: CitySelectProps) {
  const cityOptions = useCityOptions();
  const isLegacy = Boolean(legacyValue) && !cityOptions.some((city) => city.value === legacyValue);
  const options = [
    ...(emptyLabel === undefined ? [] : [{ value: "", label: emptyLabel }]),
    ...(isLegacy && legacyValue ? [{ value: legacyValue, label: legacyValue }] : []),
    ...cityOptions,
  ];

  return <NativeSelect options={options} {...props} />;
}
