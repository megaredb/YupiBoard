import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import { SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { Button } from "@/components/ui/button"
import { useEvents } from "../api"
import { EventFilters } from "../components/catalog/EventFilters"
import { EventFiltersSheet } from "../components/catalog/EventFiltersSheet"
import { EventListSection } from "../components/EventListSection"
import { DEFAULT_FILTERS, EVENTS_PAGE_SIZE, LOCATION_OPTIONS } from "../constants"
import type { EventFilters as EventFiltersValue } from "../types"

const route = getRouteApi("/_app/events/")

/** /events: browse and filter upcoming events. Filters and page live in the URL. */
export function EventCatalogPage() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [isSheetOpen, setSheetOpen] = useState(false)

  const filters: EventFiltersValue = { locationId: search.location, maxDistanceKm: search.distance }
  const events = useEvents({ ...filters, page: search.page, pageSize: EVENTS_PAGE_SIZE })

  const city = LOCATION_OPTIONS.find((option) => option.id === filters.locationId)?.label.split(",")[0]

  const applyFilters = (next: EventFiltersValue) =>
    void navigate({ search: { location: next.locationId, distance: next.maxDistanceKm, page: 1 } })

  return (
    <PageContainer size="wide">
      <PageHeader title={t("events.catalog.title")} description={t("events.catalog.subtitle", { city })} />

      <div className="mt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <EventFilters value={filters} onChange={applyFilters} onClear={() => applyFilters(DEFAULT_FILTERS)} />
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex justify-end lg:hidden">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal />
              {t("events.filters.title")}
            </Button>
          </div>

          <EventListSection
            query={events}
            showOrganizer
            countLabel={(count) => t("events.catalog.found", { count })}
            emptyTitle={t("events.catalog.emptyTitle")}
            emptyDescription={t("events.catalog.emptyDescription")}
            onPageChange={(page) => void navigate({ search: (previous) => ({ ...previous, page }) })}
          />
        </section>
      </div>

      <EventFiltersSheet open={isSheetOpen} onOpenChange={setSheetOpen} value={filters} onApply={applyFilters} />
    </PageContainer>
  )
}
