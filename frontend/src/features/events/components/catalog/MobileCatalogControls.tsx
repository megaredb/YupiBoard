import { Search, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { LOCATION_OPTIONS } from "../../mocks/fixtures"
import type { EventFilters } from "../../types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MobileCatalogControlsProps {
  filters: EventFilters
  query: string
  onQueryChange: (query: string) => void
  onLocationChange: (locationId: string) => void
  onOpenFilters: () => void
}

export function MobileCatalogControls({
  filters,
  query,
  onQueryChange,
  onLocationChange,
  onOpenFilters,
}: MobileCatalogControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2 lg:hidden">
      <label className="relative block">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={t("events.catalog.searchPlaceholder")}
          aria-label={t("events.catalog.searchPlaceholder")}
          className="h-11 rounded-xl bg-card pl-10"
        />
      </label>

      <div className="flex items-center justify-between gap-3">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{t("events.filters.location")}</span>
          <select
            value={filters.locationId}
            onChange={(event) => onLocationChange(event.target.value)}
            className="h-10 w-full min-w-0 cursor-pointer appearance-none rounded-lg bg-transparent px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {LOCATION_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </label>
        <Button type="button" variant="outline" size="sm" onClick={onOpenFilters}>
          <SlidersHorizontal />
          {t("events.filters.title")}
        </Button>
      </div>
    </div>
  )
}
