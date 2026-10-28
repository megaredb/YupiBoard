import { useState } from "react"
import { useParams } from "@tanstack/react-router"
import { MapPin, Shield, Star } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useListEventsApiV1EventsGet } from "@/api/endpoints/events/events"
import { useGetUserApiV1UsersUserIdGet } from "@/api/endpoints/users/users"
import { EventList } from "@/components/EventList"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/stores/auth"

function formatMemberSince(isoDate: string | undefined, fallback: string): string {
  if (!isoDate) return fallback
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export function PublicProfilePage() {
  const { userId } = useParams({ from: "/users/$userId" })
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>("hosted")
  const dash = t("profile.notProvided")

  const currentUser = useAuthStore((s) => s.user)
  const { data: profileUser } = useGetUserApiV1UsersUserIdGet(userId)
  const user = profileUser ?? (currentUser?.id === userId ? currentUser : null)

  const {
    data: allEventsData,
    isLoading: isLoadingEvents,
    isError: isEventsError,
    refetch: refetchEvents,
  } = useListEventsApiV1EventsGet({ limit: 100 })

  const allEvents = allEventsData?.items ?? []
  const hostedEvents = allEvents.filter(
    (event) => ("organizer_id" in event && event.organizer_id === userId) || event.organizer?.id === userId,
  )
  const joinedEvents = allEvents.filter(
    (event) => "participant_ids" in event && Array.isArray((event as any).participant_ids) && (event as any).participant_ids.includes(userId),
  )

  const fullName =
    [user?.first_name, user?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || user?.email || dash
  const firstName = user?.first_name?.trim() || user?.email || dash
  const city = user?.city || (user as any)?.location || dash
  const bio = (user as any)?.bio || dash
  const contact = user?.contact_info || (user as any)?.contacts || dash
  const avatarUrl = user?.avatar_url
  const bannerUrl = (user as any)?.banner_url

  const playerRating =
    user?.rating_as_player != null
      ? Number(user.rating_as_player).toFixed(1)
      : dash
  const playerReviews = (user as any)?.player_reviews_count ?? dash
  const organizerRating =
    user?.rating_as_organizer != null
      ? Number(user.rating_as_organizer).toFixed(1)
      : dash
  const organizerReviews = (user as any)?.organizer_reviews_count ?? dash

  const initials = (
    `${user?.first_name?.trim()?.[0] ?? ""}${user?.last_name?.trim()?.[0] ?? ""}` ||
    user?.email?.[0] ||
    dash
  ).toUpperCase()

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="relative h-44 w-full overflow-hidden bg-linear-to-r from-foreground/90 via-primary/40 to-foreground/85 sm:h-52 sm:rounded-b-2xl">
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt=""
            className="size-full object-cover opacity-85"
          />
        )}
      </div>

      {/* Main Content */}
      <div className="mx-auto -mt-20 max-w-5xl space-y-8 px-4 sm:px-6">
        {/* Public User Header Card */}
        <Card className="relative z-10 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="flex items-center gap-4 lg:col-span-4">
              <Avatar className="size-16 shrink-0 border-2 border-card shadow-xs sm:size-20">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={fullName} />}
                <AvatarFallback className="text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {fullName}
                </h1>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                  <span>{city}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profile.memberSince", {
                    date: formatMemberSince(user?.created_at, dash),
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 lg:col-span-4">
              <p className="line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                {bio}
              </p>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {contact}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:col-span-4">
              <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("profile.playerRating")}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <Star
                    className="size-4 fill-warning text-warning"
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold text-foreground">
                    {playerRating}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("profile.reviewsCount", { count: playerReviews })}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("profile.organizerRating")}
                </p>
                <div className="mt-1 flex items-center justify-center gap-1.5">
                  <Shield className="size-4 text-primary" aria-hidden="true" />
                  <span className="text-base font-bold text-foreground">
                    {organizerRating}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("profile.reviewsCount", { count: organizerReviews })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Events Tabs Section */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value)}
          className="space-y-6"
        >
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <TabsList className="h-auto w-fit gap-2 bg-transparent p-0">
              <TabsTrigger
                value="hosted"
                className="h-9 rounded-lg border border-border bg-muted/60 px-4 text-xs font-medium text-foreground data-active:border-primary data-active:bg-primary data-active:text-primary-foreground"
              >
                {t("profile.public.hostedEvents", { count: hostedEvents.length })}
              </TabsTrigger>
              <TabsTrigger
                value="joined"
                className="h-9 rounded-lg border border-border bg-muted/60 px-4 text-xs font-medium text-foreground data-active:border-primary data-active:bg-primary data-active:text-primary-foreground"
              >
                {t("profile.public.joinedEvents", { count: joinedEvents.length })}
              </TabsTrigger>
            </TabsList>

            <p className="text-xs text-muted-foreground">
              {activeTab === "hosted"
                ? t("profile.public.upcomingHostedBy", { name: firstName })
                : t("profile.public.upcomingJoinedBy", { name: firstName })}
            </p>
          </div>

          <TabsContent value="hosted" className="space-y-6">
            <EventList
              events={hostedEvents}
              isPending={isLoadingEvents}
              isError={isEventsError}
              onRetry={() => void refetchEvents()}
              showOrganizer={false}
              emptyTitle={t("profile.public.noHostedEvents", "No hosted events")}
              emptyDescription={t("profile.public.noHostedEventsDesc", "This organizer has not hosted any events yet.")}
            />
          </TabsContent>

          <TabsContent value="joined" className="space-y-6">
            <EventList
              events={joinedEvents}
              isPending={isLoadingEvents}
              isError={isEventsError}
              onRetry={() => void refetchEvents()}
              showOrganizer={true}
              emptyTitle={t("profile.public.noJoinedEvents", "No joined events")}
              emptyDescription={t("profile.public.noJoinedEventsDesc", "This user has not joined any events yet.")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
