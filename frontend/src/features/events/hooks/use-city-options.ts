import { useTranslation } from "react-i18next"
import type { NativeSelectOption } from "@/shared/ui/native-select"
import { CITIES } from "@/features/events/lib/cities"

export function useCityOptions(): NativeSelectOption[] {
  const { t } = useTranslation()
  return CITIES.map((city) => ({ value: city.id, label: t(city.labelKey) }))
}
