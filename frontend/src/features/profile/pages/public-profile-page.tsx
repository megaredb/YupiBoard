import { useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { EventList, EventPagination, useHostedEvents, useJoinedEvents } from "@/features/events";
import { ProfileBanner } from "@/features/profile/components/profile-banner";
import { ProfileSummaryCard } from "@/features/profile/components/profile-summary-card";
import { usePublicUser } from "@/features/profile/hooks/use-public-user";
import { getFullName, UserAvatar } from "@/features/users";

const route = getRouteApi("/users/$userId");

type PublicEventsTab = "hosted" | "joined";

function PublicEventsTabBar({
  activeTab,
  hostedCount,
  joinedCount,
  subtitle,
  onSelectTab,
}: {
  activeTab: PublicEventsTab;
  hostedCount: number;
  joinedCount: number;
  subtitle: string;
  onSelectTab: (tab: PublicEventsTab) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <button
          type="button"
          onClick={() => onSelectTab("hosted")}
          className={cn(
            "h-11 cursor-pointer rounded-lg border px-4 text-xs font-medium transition-colors sm:h-9",
            activeTab === "hosted"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border bg-muted/60 text-foreground hover:bg-muted",
          )}
        >
          {t("profile.public.hostedEvents", { count: hostedCount })}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab("joined")}
          className={cn(
            "h-11 cursor-pointer rounded-lg border px-4 text-xs font-medium transition-colors sm:h-9",
            activeTab === "joined"
              ? "border-primary bg-primary text-primary-foreground shadow-xs"
              : "border-border bg-muted/60 text-foreground hover:bg-muted",
          )}
        >
          {t("profile.public.joinedEvents", { count: joinedCount })}
        </button>
      </div>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function PublicProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = route.useParams();
  const { page } = route.useSearch();
  const [activeTab, setActiveTab] = useState<PublicEventsTab>("hosted");
  const user = usePublicUser(userId);
  const hosted = useHostedEvents(userId, page);
  const joined = useJoinedEvents(userId, page);
  const name = getFullName(user) ?? t("profile.public.unnamedUser");
  const firstName = user.first_name?.trim() || name;
  const currentEvents = activeTab === "hosted" ? hosted : joined;

  const handlePageChange = (next: number) =>
    void navigate({ to: "/users/$userId", params: { userId }, search: { page: next } });
  const handleTabChange = (nextTab: PublicEventsTab) => {
    setActiveTab(nextTab);
    if (page !== 1) handlePageChange(1);
  };

  return (
    <div className="space-y-8 pb-12">
      <ProfileBanner imageUrl={user.banner_url} />
      <div className="mx-auto -mt-20 max-w-5xl space-y-8 px-4 sm:px-6">
        <ProfileSummaryCard
          user={user}
          name={name}
          showCity
          avatar={
            <UserAvatar name={name} avatarUrl={user.avatar_url} className="size-16 sm:size-20" />
          }
        />
        <section className="space-y-6">
          <PublicEventsTabBar
            activeTab={activeTab}
            hostedCount={hosted.total ?? 0}
            joinedCount={joined.total ?? 0}
            subtitle={
              activeTab === "hosted"
                ? t("profile.public.upcomingHostedBy", { name: firstName })
                : t("profile.public.upcomingJoinedBy", { name: firstName })
            }
            onSelectTab={handleTabChange}
          />
          <EventList
            state={currentEvents.list}
            showOrganizer={activeTab === "joined"}
            empty={{
              title:
                activeTab === "hosted"
                  ? t("profile.public.noHostedEvents")
                  : t("profile.public.noJoinedEvents"),
              description:
                activeTab === "hosted"
                  ? t("profile.public.noHostedEventsDescription")
                  : t("profile.public.noJoinedEventsDescription"),
            }}
          />
          <EventPagination
            page={page}
            total={currentEvents.total}
            totalPages={currentEvents.totalPages}
            onPageChange={handlePageChange}
          />
        </section>
      </div>
    </div>
  );
}
