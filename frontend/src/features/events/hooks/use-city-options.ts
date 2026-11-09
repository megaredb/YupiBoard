import type { NativeSelectOption } from "@/shared/ui/native-select";
import { useCities } from "@/features/events/hooks/use-cities";

/** City names come from the backend as they are; it does not localise them. */
export function useCityOptions(): NativeSelectOption[] {
  return useCities().map((city) => ({ value: city.name, label: city.name }));
}
