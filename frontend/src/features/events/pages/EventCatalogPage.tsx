import { useState } from "react"
import { getRouteApi } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { useEvents } from "../api"
import { EventFilters } from "../components/catalog/EventFilters"
import { EventFiltersSheet } from "../components/catalog/EventFiltersSheet"
import { MobileCatalogControls } from "../components/catalog/MobileCatalogControls"
import { EventListSection } from "../components/EventListSection"
import { DEFAULT_FILTERS, EVENTS_PAGE_SIZE } from "../constants"
import { LOCATION_OPTIONS } from "../mocks/fixtures"
import type { EventFilters as EventFiltersValue } from "../types"

const route = getRouteApi("/_app/events/")

export function EventCatalogPage() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const [isSheetOpen, setSheetOpen] = useState(false)

  const filters: EventFiltersValue = { locationId: search.location, maxDistanceKm: search.distance }
  const events = useEvents({ ...filters, page: search.page, pageSize: EVENTS_PAGE_SIZE, query: search.q })

  const city = LOCATION_OPTIONS.find((option) => option.id === filters.locationId)?.label.split(",")[0]

  const applyFilters = (next: EventFiltersValue) =>
    void navigate({ search: { location: next.locationId, distance: next.maxDistanceKm, page: 1, q: search.q } })

  return (
    <PageContainer size="wide">
      <PageHeader
        className="hidden lg:flex"
        title={t("events.catalog.title")}
        description={t("events.catalog.subtitle", { city })}
      />

      <div className="lg:mt-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <EventFilters value={filters} onChange={applyFilters} onClear={() => applyFilters(DEFAULT_FILTERS)} />
        </aside>

        <section className="min-w-0">
          <MobileCatalogControls
            filters={filters}
            query={search.q}
            onQueryChange={(query) => void navigate({
              search: (previous) => ({ ...previous, q: query, page: 1 }),
              replace: true,
            })}
            onLocationChange={(locationId) => applyFilters({ ...filters, locationId })}
            onOpenFilters={() => setSheetOpen(true)}
          />

          <PageHeader
            className="mb-4 lg:hidden"
            title={t("events.catalog.mobileTitle")}
            aside={<span className="text-xs text-muted-foreground">{events.data?.total ?? 0} {t("events.catalog.countLabel")}</span>}
          />

          <EventListSection
            query={events}
            showOrganizer
            countLabel={(count) => t("events.catalog.found", { count })}
            countClassName="hidden lg:block"
            emptyTitle={t("events.catalog.emptyTitle")}
            emptyDescription={t("events.catalog.emptyDescription")}
            onPageChange={(page) => void navigate({ search: (previous) => ({ ...previous, page }) })}
          />
        </section>
      </div>

      <EventFiltersSheet
        open={isSheetOpen}
        onOpenChange={setSheetOpen}
        value={filters}
        query={search.q}
        onApply={applyFilters}
      />
    </PageContainer>
  )
}
