import { useState, type ReactNode } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { keepPreviousData } from "@tanstack/react-query"
import { LocateFixed, SlidersHorizontal } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useListEventsApiV1EventsGet } from "@/api/endpoints/events/events"
import { EventList } from "@/components/EventList"
import { PageContainer } from "@/components/layout/PageContainer"
import { PageHeader } from "@/components/layout/PageHeader"
import { BottomSheet } from "@/components/ui/bottom-sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { RangeSlider } from "@/components/ui/range-slider"
import {
  CITY_OPTIONS,
  DEFAULT_CITY_ID,
  DEFAULT_DISTANCE_KM,
  DISTANCE_RANGE_KM,
  EVENTS_PAGE_SIZE,
  catalogSearchSchema,
  getCity,
  type CatalogSearch,
} from "@/lib/events"

interface Filters {
  city: string
  distance: number
}

const DEFAULT_FILTERS: Filters = { city: DEFAULT_CITY_ID, distance: DEFAULT_DISTANCE_KM }
const CITY_SELECT_OPTIONS = CITY_OPTIONS.map((city) => ({ value: city.id, label: city.label }))

/** `GET /api/v1/events` params for the given filters. */
function toListParams(filters: Filters, page: number, limit: number) {
  const city = getCity(filters.city)
  return { lat: city.lat, lon: city.lon, radius_km: filters.distance, page, limit }
}

function FilterFields({ value, onChange }: { value: Filters; onChange: (next: Filters) => void }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="catalog-city" className="text-sm font-medium">
          {t("events.filters.location")}
        </Label>
        <NativeSelect
          id="catalog-city"
          variant="tinted"
          startIcon={<LocateFixed />}
          options={CITY_SELECT_OPTIONS}
          value={value.city}
          onChange={(event) => onChange({ ...value, city: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">{t("events.filters.fromCityCenter")}</p>
      </div>

      <RangeSlider
        label={t("events.filters.distance")}
        formatValue={(km) => t("events.filters.within", { km })}
        formatBound={(km) => t("events.filters.km", { km })}
        min={DISTANCE_RANGE_KM.min}
        max={DISTANCE_RANGE_KM.max}
        value={value.distance}
        onCommit={(distance) => onChange({ ...value, distance })}
      />
    </div>
  )
}

/** Mobile filters: edits a draft and shows the live result count on the apply button. */
function FiltersSheet({
  open,
  onOpenChange,
  value,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: Filters
  onApply: (next: Filters) => void
}) {
  const { t } = useTranslation()

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("events.filters.title")} closeLabel={t("common.close")}>
      {/* Remounted on every open so the draft always starts from the applied filters. */}
      {open && (
        <FiltersSheetBody
          value={value}
          onApply={(next) => {
            onApply(next)
            onOpenChange(false)
          }}
        />
      )}
    </BottomSheet>
  )
}

function FiltersSheetBody({ value, onApply }: { value: Filters; onApply: (next: Filters) => void }): ReactNode {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(value)
  // Page size 1: only `total` is needed for the button label.
  const preview = useListEventsApiV1EventsGet(toListParams(draft, 1, 1))

  return (
    <div className="space-y-6">
      <FilterFields value={draft} onChange={setDraft} />
      <div className="flex gap-3 border-t pt-4">
        <Button variant="outline" size="lg" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
          {t("events.filters.clearAll")}
        </Button>
        <Button size="lg" className="flex-[1.5]" onClick={() => onApply(draft)}>
          {preview.data
            ? t("events.filters.showResults", { count: preview.data.total })
            : t("events.filters.show")}
        </Button>
      </div>
    </div>
  )
}

export function EventCatalogPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Shared by `/` and `/events`, so read the search loosely and normalize with the same schema.
  const search: CatalogSearch = catalogSearchSchema.parse(useSearch({ strict: false }))
  const [isSheetOpen, setSheetOpen] = useState(false)

  const filters: Filters = { city: search.city, distance: search.distance }
  const events = useListEventsApiV1EventsGet(toListParams(filters, search.page, EVENTS_PAGE_SIZE), {
    query: { placeholderData: keepPreviousData },
  })
  const city = getCity(filters.city).name

  const goTo = (next: CatalogSearch) => void navigate({ to: "/events", search: next })
  const applyFilters = (next: Filters) => goTo({ ...next, page: 1 })

  return (
    <PageContainer size="wide">
      <PageHeader
        className="hidden lg:flex"
        title={t("events.catalog.title")}
        description={t("events.catalog.subtitle", { city })}
      />

      <div className="lg:mt-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {t("events.filters.title")}
                <SlidersHorizontal aria-hidden className="size-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <FilterFields value={filters} onChange={applyFilters} />
              <div className="border-t pt-4">
                <Button variant="outline" className="w-full" onClick={() => applyFilters(DEFAULT_FILTERS)}>
                  {t("events.filters.clear")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
            <div className="min-w-0 flex-1">
              <Label htmlFor="catalog-city-mobile" className="sr-only">
                {t("events.filters.location")}
              </Label>
              <NativeSelect
                id="catalog-city-mobile"
                variant="ghost"
                options={CITY_SELECT_OPTIONS}
                value={filters.city}
                onChange={(event) => applyFilters({ ...filters, city: event.target.value })}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setSheetOpen(true)}>
              <SlidersHorizontal />
              {t("events.filters.title")}
            </Button>
          </div>

          <PageHeader
            className="mb-4 lg:hidden"
            title={t("events.catalog.mobileTitle")}
            aside={
              <span className="text-xs text-muted-foreground">
                {t("events.catalog.found", { count: events.data?.total ?? 0 })}
              </span>
            }
          />

          <EventList
            events={events.data?.items}
            isPending={events.isPending}
            isError={events.isError}
            isFetching={events.isPlaceholderData}
            onRetry={() => void events.refetch()}
            showOrganizer
            countLabel={events.data ? t("events.catalog.found", { count: events.data.total }) : undefined}
            countClassName="hidden lg:block"
            emptyTitle={t("events.catalog.emptyTitle")}
            emptyDescription={t("events.catalog.emptyDescription")}
            pagination={
              events.data && {
                page: events.data.page,
                pageSize: EVENTS_PAGE_SIZE,
                total: events.data.total,
                totalPages: events.data.total_pages,
                onPageChange: (page) => goTo({ ...search, page }),
              }
            }
          />
        </section>
      </div>

      <FiltersSheet open={isSheetOpen} onOpenChange={setSheetOpen} value={filters} onApply={applyFilters} />
    </PageContainer>
  )
}
