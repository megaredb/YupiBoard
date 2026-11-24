import { useTranslation } from "react-i18next";
import { SearchField } from "@/shared/components/search-field";
import { PageContainer } from "@/shared/layout/page-container";
import { PageHeader } from "@/shared/layout/page-header";
import { EventPagination } from "@/features/events";
import { ModerationEventList } from "@/features/moderation/components/moderation-event-list";
import { ModerationSortSelect } from "@/features/moderation/components/moderation-sort-select";
import { ModerationTabs } from "@/features/moderation/components/moderation-tabs";
import { useModerationQueue } from "@/features/moderation/hooks/use-moderation-queue";
import { useModerationSearch } from "@/features/moderation/hooks/use-moderation-search";
import { MODERATION_QUERY_MAX_LENGTH } from "@/features/moderation/schemas/moderation-search.schema";

export function ModerationQueuePage() {
  const { t } = useTranslation();
  const { search, applySearch, goToPage } = useModerationSearch();
  const queue = useModerationQueue(search);

  return (
    <PageContainer size="wide">
      <PageHeader
        title={t("admin.moderation.title")}
        description={t("admin.moderation.description")}
      />
      <div className="mt-6 space-y-6">
        <div className="flex flex-col gap-3 desktop:flex-row desktop:items-center">
          <ModerationTabs
            value={search.tab}
            pendingCount={queue.pendingCount}
            onChange={(tab) => applySearch({ tab })}
          />
          <SearchField
            key={search.q ?? ""}
            label={t("admin.moderation.search.label")}
            placeholder={t("admin.moderation.search.placeholder")}
            submitLabel={t("admin.moderation.search.submit")}
            maxLength={MODERATION_QUERY_MAX_LENGTH}
            defaultValue={search.q ?? ""}
            onSearch={(q) => applySearch({ q: q || undefined })}
            className="desktop:mx-auto desktop:max-w-sm"
          />
          <ModerationSortSelect value={search.sort} onChange={(sort) => applySearch({ sort })} />
        </div>
        {queue.total !== null && (
          <p className="text-sm font-semibold">
            {t("admin.moderation.found", { count: queue.total })}
          </p>
        )}
        <ModerationEventList
          state={queue.list}
          tab={search.tab}
          isSearching={Boolean(search.q)}
          isRefreshing={queue.isRefreshing}
        />
        <EventPagination
          page={queue.page}
          total={queue.total}
          totalPages={queue.totalPages}
          onPageChange={goToPage}
        />
      </div>
    </PageContainer>
  );
}
