import { LocateFixed } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LOCATION_OPTIONS } from "../../constants"
import type { EventFilters } from "../../types"
import { DistanceSlider } from "./DistanceSlider"

interface EventFiltersFieldsProps {
  value: EventFilters
  onChange: (next: EventFilters) => void
}

/** The filter controls themselves; wrapped by the desktop sidebar and the mobile sheet. */
export function EventFiltersFields({ value, onChange }: EventFiltersFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="location-select" className="text-sm font-medium">
          {t("events.filters.location")}
        </label>
        <div className="relative">
          <LocateFixed aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary" />
          <select
            id="location-select"
            value={value.locationId}
            onChange={(event) => onChange({ ...value, locationId: event.target.value })}
            className="h-10 w-full cursor-pointer appearance-none rounded-lg bg-primary/10 pr-8 pl-9 text-sm font-medium text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-primary">
            ▾
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{t("events.filters.usingCurrentLocation")}</p>
      </div>

      <DistanceSlider
        value={value.maxDistanceKm}
        onCommit={(maxDistanceKm) => onChange({ ...value, maxDistanceKm })}
      />
    </div>
  )
}
