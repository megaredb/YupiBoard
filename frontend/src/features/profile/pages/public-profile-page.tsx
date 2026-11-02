import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Badge } from "@/shared/ui/badge";
import { EventList, EventPagination, useHostedEvents } from "@/features/events";
import { UserAvatar, getDisplayName } from "@/features/users";
import { ProfileBanner } from "@/features/profile/components/profile-banner";
import { ProfileSummaryCard } from "@/features/profile/components/profile-summary-card";
import { usePublicUser } from "@/features/profile/hooks/use-public-user";

const route = getRouteApi("/users/$userId");

// Only `UserRead` fields are shown: bio, banner, review counts and joined events are not part of
// the public API yet.
export function PublicProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = route.useParams();
  const { page } = route.useSearch();
  const user = usePublicUser(userId);
  const hosted = useHostedEvents(userId, page);
  const name = getDisplayName(user);
  const handlePageChange = (next: number) =>
    void navigate({ to: "/users/$userId", params: { userId }, search: { page: next } });

  return (
    <div className="space-y-8 pb-12">
      <ProfileBanner />
      <div className="mx-auto -mt-20 max-w-5xl space-y-8 px-4 sm:px-6">
        <ProfileSummaryCard
          user={user}
          showCity
          avatar={
            <UserAvatar name={name} avatarUrl={user.avatar_url} className="size-16 sm:size-20" />
          }
        />
        {user.contact_info && (
          <Badge variant="secondary" className="px-3 py-1">
            {user.contact_info}
          </Badge>
        )}
        <section className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">{t("profile.public.hostedEvents")}</h2>
            <p className="text-xs text-muted-foreground">
              {t("profile.public.upcomingHostedBy", { name })}
            </p>
          </div>
          <EventList
            state={hosted.list}
            showOrganizer={false}
            empty={{
              title: t("profile.public.noHostedEvents"),
              description: t("profile.public.noHostedEventsDescription"),
            }}
          />
          <EventPagination
            page={page}
            total={hosted.total}
            totalPages={hosted.totalPages}
            onPageChange={handlePageChange}
          />
        </section>
      </div>
    </div>
  );
}
