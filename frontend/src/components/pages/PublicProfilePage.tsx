import { useState } from "react"
import { useParams } from "@tanstack/react-router"
import { Calendar, MapPin, Shield, Star, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useGetUserProfileByIdApiV1UsersUserIdGet } from "@/api/endpoints/users/users"
import logoSvg from "@/assets/logo.svg"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const PLACEHOLDER_CARD_SLOTS = [0, 1, 2] as const

function formatMemberSince(isoDate: string | undefined, fallback: string): string {
  if (!isoDate) return fallback
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return fallback
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

function EventPlaceholderCard() {
  const { t } = useTranslation()
  const dash = t("profile.notProvided")

  return (
    <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-xs">
      <div className="relative h-48 w-full overflow-hidden bg-linear-to-br from-foreground/85 via-primary/35 to-muted">
        <div className="flex size-full items-center justify-center">
          <img
            src={logoSvg}
            alt=""
            className="size-16 object-contain opacity-80"
          />
        </div>

        <Badge
          variant="secondary"
          className="absolute right-3 bottom-3 z-10 rounded-lg bg-card/95 px-2.5 py-1 text-xs font-semibold shadow-xs"
        >
          <span>{dash}</span>
          <Users className="size-3.5" aria-hidden="true" />
        </Badge>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground">
          {dash}
        </h3>

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{dash}</span>
            </span>

            <span className="text-sm font-semibold text-foreground">{dash}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
            <span>{dash}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export function PublicProfilePage() {
  const { userId } = useParams({ from: "/users/$userId" })
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>("hosted")
  const dash = t("profile.notProvided")

  const { data: profileUser } = useGetUserProfileByIdApiV1UsersUserIdGet(userId)

  const fullName =
    [profileUser?.first_name, profileUser?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || dash
  const firstName = profileUser?.first_name?.trim() || dash
  const city = profileUser?.city || profileUser?.location || dash
  const bio = profileUser?.bio || dash
  const contact = profileUser?.contact_info || profileUser?.contacts || dash
  const avatarUrl = profileUser?.avatar_url
  const bannerUrl = profileUser?.banner_url

  const playerRating =
    profileUser?.player_rating != null
      ? profileUser.player_rating.toFixed(2)
      : (profileUser?.rating_as_player ?? dash)
  const playerReviews = profileUser?.player_reviews_count ?? dash
  const organizerRating =
    profileUser?.organizer_rating != null
      ? profileUser.organizer_rating.toFixed(2)
      : (profileUser?.rating_as_organizer ?? dash)
  const organizerReviews = profileUser?.organizer_reviews_count ?? dash

  const initials = (
    `${profileUser?.first_name?.trim()?.[0] ?? ""}${profileUser?.last_name?.trim()?.[0] ?? ""}` ||
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
                    date: formatMemberSince(profileUser?.created_at, dash),
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
                {t("profile.public.hostedEvents", { count: dash })}
              </TabsTrigger>
              <TabsTrigger
                value="joined"
                className="h-9 rounded-lg border border-border bg-muted/60 px-4 text-xs font-medium text-foreground data-active:border-primary data-active:bg-primary data-active:text-primary-foreground"
              >
                {t("profile.public.joinedEvents", { count: dash })}
              </TabsTrigger>
            </TabsList>

            <p className="text-xs text-muted-foreground">
              {activeTab === "hosted"
                ? t("profile.public.upcomingHostedBy", { name: firstName })
                : t("profile.public.upcomingJoinedBy", { name: firstName })}
            </p>
          </div>

          <TabsContent value="hosted" className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PLACEHOLDER_CARD_SLOTS.map((slot) => (
                <EventPlaceholderCard key={slot} />
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-6 text-xs font-medium"
              >
                {t("profile.public.showMoreEvents")}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="joined" className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {PLACEHOLDER_CARD_SLOTS.map((slot) => (
                <EventPlaceholderCard key={slot} />
              ))}
            </div>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="h-9 rounded-xl px-6 text-xs font-medium"
              >
                {t("profile.public.showMoreEvents")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
