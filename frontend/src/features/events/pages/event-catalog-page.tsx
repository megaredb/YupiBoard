import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageContainer } from "@/shared/layout/page-container";
import { PageHeader } from "@/shared/layout/page-header";
import { CatalogFiltersCard } from "@/features/events/components/event-catalog/catalog-filters-card";
import { MobileCatalogToolbar } from "@/features/events/components/event-catalog/mobile-catalog-toolbar";
import { MobileFiltersSheet } from "@/features/events/components/event-catalog/mobile-filters-sheet";
import { EventList } from "@/features/events/components/event-list";
import { EventPagination } from "@/features/events/components/event-pagination";
import { useCatalogFilters } from "@/features/events/hooks/use-catalog-filters";
import { useEventCatalog } from "@/features/events/hooks/use-event-catalog";
import { getCity } from "@/features/events/lib/cities";

export function EventCatalogPage() {
  const { t } = useTranslation();
  const { filters, page, applyFilters, goToPage } = useCatalogFilters();
  const { list, total, totalPages, isRefreshing } = useEventCatalog(filters, page);
  const [isSheetOpen, setSheetOpen] = useState(false);
  const cityName = t(getCity(filters.city).labelKey);
  const foundLabel = total === null ? null : t("events.catalog.found", { count: total });
  const handleOpenSheet = () => setSheetOpen(true);

  return (
    <PageContainer size="wide">
      <PageHeader
        className="hidden lg:flex"
        title={t("events.catalog.title")}
        description={t("events.catalog.subtitle", { city: cityName })}
      />

      <div className="lg:mt-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <CatalogFiltersCard value={filters} onApply={applyFilters} />
        </aside>

        <section className="min-w-0 space-y-6">
          <div>
            <MobileCatalogToolbar
              value={filters}
              onApply={applyFilters}
              onOpenFilters={handleOpenSheet}
            />
            <PageHeader
              className="lg:hidden"
              title={t("events.catalog.mobileTitle")}
              aside={
                foundLabel && <span className="text-xs text-muted-foreground">{foundLabel}</span>
              }
            />
            {foundLabel && <p className="hidden text-sm font-semibold lg:block">{foundLabel}</p>}
          </div>
          <EventList
            state={list}
            isRefreshing={isRefreshing}
            showOrganizer
            empty={{
              title: t("events.catalog.emptyTitle"),
              description: t("events.catalog.emptyDescription"),
            }}
          />
          <EventPagination
            page={page}
            total={total}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </section>
      </div>

      <MobileFiltersSheet
        isOpen={isSheetOpen}
        onOpenChange={setSheetOpen}
        value={filters}
        onApply={applyFilters}
      />
    </PageContainer>
  );
}
