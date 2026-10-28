import { useEffect, useState } from "react";
import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  ChevronRight,
  Flag,
  Heart,
  MapPin,
  Share2,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCreateBookingRequestApiV1EventsIdBookingsPost } from "@/api/endpoints/bookings/bookings";
import {
  getGetEventApiV1EventsEventIdGetQueryKey,
  useGetEventApiV1EventsEventIdGet,
} from "@/api/endpoints/events/events";
import { useGetUserApiV1UsersUserIdGet } from "@/api/endpoints/users/users";
import type { BookingStatus, EventRead } from "@/api/model";
import { PageContainer } from "@/components/layout/PageContainer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeatsProgress } from "@/components/ui/seats-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusMessage } from "@/components/ui/status-message";
import { toggleSavedEvent, useGoBack, useSavedEventIds } from "@/lib/events";
import {
  formatLongDate,
  formatPrice,
  formatTimeRange,
  getInitials,
  parseAmount,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

const route = getRouteApi("/events/$eventId");
const COLLAPSIBLE_AFTER_CHARS = 160;

interface BookingAction {
  label: string;
  disabled: boolean;
  isPending: boolean;
  hasError: boolean;
  onClick: () => void;
}

function useBookingAction(event: EventRead): BookingAction {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const bookedIds = useSavedEventIds("bookings");
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(
    null,
  );

  const booking = useCreateBookingRequestApiV1EventsIdBookingsPost({
    mutation: {
      onSuccess: (response) => {
        setBookingStatus(response.status);
        toggleSavedEvent("bookings", event.id, true);
        void queryClient.invalidateQueries({
          queryKey: getGetEventApiV1EventsEventIdGetQueryKey(event.id),
        });
      },
    },
  });

  const base = {
    isPending: booking.isPending,
    hasError: booking.isError,
    onClick: () => {},
  };

  if (user?.id === event.organizer_id)
    return { ...base, disabled: true, label: t("events.booking.hosting") };
  if (event.status !== "Published")
    return { ...base, disabled: true, label: t("events.booking.closed") };
  if (bookingStatus === "Confirmed")
    return { ...base, disabled: true, label: t("events.booking.approved") };
  if (bookingStatus === "Waitlist")
    return { ...base, disabled: true, label: t("events.booking.waitlist") };
  if (bookingStatus || bookedIds.includes(event.id)) {
    return { ...base, disabled: true, label: t("events.booking.pending") };
  }
  if (event.available_seats <= 0)
    return { ...base, disabled: true, label: t("events.booking.full") };

  return {
    ...base,
    disabled: false,
    label: t("events.booking.apply"),
    onClick: () => {
      if (user) booking.mutate({ id: event.id });
      else void navigate({ to: "/login" });
    },
  };
}

function FavoriteButton({
  eventId,
  className,
}: {
  eventId: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const isFavorite = useSavedEventIds("favorites").includes(eventId);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? t("events.details.unfavorite")
          : t("events.details.favorite")
      }
      onClick={() => toggleSavedEvent("favorites", eventId, !isFavorite)}
      className={cn(
        "size-10 rounded-full bg-card/90 text-foreground shadow-sm hover:bg-card",
        className,
      )}
    >
      <Heart
        className={cn(
          "size-5",
          isFavorite ? "fill-primary text-primary" : "text-foreground",
        )}
      />
    </Button>
  );
}

function ShareButton({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // Dismissed
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={
        copied ? t("events.details.linkCopied") : t("events.details.share")
      }
      onClick={() => void share()}
      className={cn(
        "size-10 rounded-full bg-card/90 text-foreground shadow-sm hover:bg-card",
        className,
      )}
    >
      {copied ? (
        <Check className="size-5 text-success" />
      ) : (
        <Share2 className="size-5 text-foreground" />
      )}
    </Button>
  );
}

function MobileTopBar({ event }: { event: EventRead }) {
  const { t } = useTranslation();
  const goBack = useGoBack();

  return (
    <div className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/50 bg-background/95 px-4 backdrop-blur-md lg:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("common.back")}
        onClick={goBack}
        className="size-9 rounded-full text-foreground hover:bg-muted"
      >
        <ArrowLeft className="size-5" />
      </Button>

      <div className="flex items-center gap-1">
        <ShareButton
          title={event.title}
          className="size-9 bg-transparent shadow-none hover:bg-muted"
        />
        <FavoriteButton
          eventId={event.id}
          className="size-9 bg-transparent shadow-none hover:bg-muted"
        />
      </div>
    </div>
  );
}

function EventHero({ event }: { event: EventRead }) {
  const { t } = useTranslation();

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-linear-to-br from-primary/20 via-primary/10 to-muted max-lg:rounded-none lg:rounded-2xl">
      {event.photo_url && (
        <img src={event.photo_url} alt="" className="size-full object-cover" />
      )}

      {event.is_promoted && (
        <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-3.5 py-1 text-xs font-semibold text-foreground shadow-sm backdrop-blur-xs lg:top-4 lg:bottom-auto lg:left-4">
          {t("events.promoted")}
        </span>
      )}

      {/* Desktop overlay actions */}
      <div className="absolute top-4 right-4 hidden items-center gap-2 lg:flex">
        <ShareButton title={event.title} />
        <FavoriteButton eventId={event.id} />
      </div>
    </div>
  );
}

function EventFacts({ event }: { event: EventRead }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Date block */}
        <div className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Calendar className="size-5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-foreground sm:text-base">
              {formatLongDate(event.start_datetime)}
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {formatTimeRange(event.start_datetime, event.end_datetime)} · Kyiv
              time
            </p>
          </div>
        </div>

        {/* Location block */}
        <div className="flex items-start gap-3.5">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <MapPin className="size-5" />
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="inline-flex items-center gap-1 text-sm font-semibold text-primary sm:text-base">
              <span>{event.game_title || event.address}</span>
              <ArrowUpRight className="size-4 shrink-0" />
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {[event.address, event.city].filter(Boolean).join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-only Players Progress Card */}
      <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 space-y-2.5 lg:hidden">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users className="size-4 text-foreground" />
          <span>
            {event.current_confirmed} of {event.max_players} players joined
          </span>
        </p>
        <SeatsProgress
          taken={event.current_confirmed}
          total={event.max_players}
          label="Seats joined"
        />
      </div>
    </div>
  );
}

function EventAbout({ description }: { description: string }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = description.length > COLLAPSIBLE_AFTER_CHARS;

  return (
    <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          {t("events.details.about")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <p
          className={cn(
            "text-sm leading-relaxed whitespace-pre-line text-muted-foreground",
            !expanded && isLong && "line-clamp-4 lg:line-clamp-none",
          )}
        >
          {description}
        </p>
        {isLong && !expanded && (
          <Button
            type="button"
            variant="link"
            onClick={() => setExpanded(true)}
            className="h-auto p-0 text-sm font-medium text-primary lg:hidden"
          >
            {t("events.details.readMore")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizerSection({ event }: { event: EventRead }) {
  const { t } = useTranslation();
  const { organizer } = event;
  const { data: organizerUser } = useGetUserApiV1UsersUserIdGet(organizer.id);

  const rating =
    organizerUser?.rating_as_organizer != null
      ? Number(organizerUser.rating_as_organizer).toFixed(2)
      : organizer.rating_as_organizer != null
        ? Number(organizer.rating_as_organizer).toFixed(2)
        : null;

  const memberYear = organizerUser?.created_at
    ? new Date(organizerUser.created_at).getFullYear()
    : "—";

  const displayName = organizerUser
    ? [organizerUser.first_name, organizerUser.last_name]
        .filter(Boolean)
        .join(" ")
        .trim() || organizer.name
    : organizer.name;

  return (
    <>
      {/* Desktop Organizer Card ("Meet your organizer") */}
      <Card className="hidden rounded-2xl border border-border bg-card p-6 shadow-sm lg:block">
        <CardHeader className="p-0 pb-5">
          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            {t("events.details.meetOrganizer")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-14 border-2 border-card shadow-xs">
                {organizerUser?.avatar_url && (
                  <AvatarImage
                    src={organizerUser.avatar_url}
                    alt={displayName}
                  />
                )}
                <AvatarFallback className="font-semibold text-base">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  {displayName}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>
                    {rating
                      ? t("events.details.organizerRating", { rating })
                      : t("profile.organizerRating")}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("events.details.organizerStats", {
                    count: 1,
                    year: memberYear,
                  })}
                </p>
              </div>
            </div>

            <Link
              to="/users/$userId"
              params={{ userId: organizer.id }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:underline"
            >
              <span>{t("events.details.viewProfile")}</span>
              <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Organizer Card ("Organizer") */}
      <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:hidden">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-lg font-bold tracking-tight text-foreground">
            {t("events.details.organizer")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Link
            to="/users/$userId"
            params={{ userId: organizer.id }}
            className="flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-3.5">
              <Avatar className="size-12 border-2 border-card shadow-xs">
                {organizerUser?.avatar_url && (
                  <AvatarImage
                    src={organizerUser.avatar_url}
                    alt={displayName}
                  />
                )}
                <AvatarFallback className="font-semibold">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <p className="text-base font-semibold text-foreground">
                  {displayName}
                </p>
                {rating && (
                  <p className="flex items-center gap-1 text-xs font-medium text-amber-500">
                    <Star className="size-3.5 fill-amber-500 text-amber-500" />
                    <span>{rating} (Organizer)</span>
                  </p>
                )}
              </div>
            </div>

            <ChevronRight className="size-5 text-muted-foreground" />
          </Link>
        </CardContent>
      </Card>
    </>
  );
}

function PriceLabel({
  event,
  className,
}: {
  event: EventRead;
  className?: string;
}) {
  const { t } = useTranslation();
  const price = parseAmount(event.entry_cost);

  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className="font-bold tracking-tight text-foreground">
        {price === 0 ? t("events.free") : formatPrice(price)}
      </span>
      {price > 0 && (
        <span className="text-sm font-normal text-muted-foreground">
          {t("events.booking.perPerson")}
        </span>
      )}
    </div>
  );
}

function BookingCard({ event }: { event: EventRead }) {
  const { t } = useTranslation();
  const action = useBookingAction(event);
  const isPaid = parseAmount(event.entry_cost) > 0;

  return (
    <aside className="space-y-3">
      <Card className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <CardContent className="space-y-5 p-0">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("events.booking.title")}
            </p>
            <PriceLabel event={event} className="mt-2 text-4xl" />
            <p className="mt-1 text-xs text-muted-foreground">
              {t("events.booking.subtitle")}
            </p>
          </div>

          <div className="space-y-2.5 border-t border-border pt-4">
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <Users className="size-4" />
              <span>
                {t("events.booking.seatsAvailable", {
                  left: event.available_seats,
                  total: event.max_players,
                })}
              </span>
            </p>
            <SeatsProgress
              taken={event.current_confirmed}
              total={event.max_players}
              label={t("events.details.seatsProgress")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {t("events.booking.playersJoining", {
                  count: event.current_confirmed,
                })}
              </span>
              <span>
                {t("events.booking.seatsTotal", { count: event.max_players })}
              </span>
            </div>
          </div>

          <Button
            size="lg"
            className="h-11 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            disabled={action.disabled}
            isLoading={action.isPending}
            onClick={action.onClick}
          >
            {action.label}
          </Button>

          {action.hasError && (
            <p role="alert" className="text-center text-xs text-destructive">
              {t("events.booking.failed")}
            </p>
          )}

          <div className="space-y-2 text-center text-xs text-muted-foreground">
            <p>{t("events.booking.reviewNote")}</p>
            {isPaid && (
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5 text-muted-foreground" />
                <span>{t("events.booking.payAtVenue")}</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Flag className="size-3.5" />
          <span>{t("events.details.report")}</span>
        </button>
      </div>
    </aside>
  );
}

function MobileBookingBar({ event }: { event: EventRead }) {
  const { t } = useTranslation();
  const action = useBookingAction(event);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-border bg-background/95 px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:hidden">
      <div className="min-w-0">
        <PriceLabel event={event} className="text-xl" />
        <p className="text-xs text-muted-foreground">
          {event.available_seats > 0
            ? t("events.booking.seatsAvailableShort")
            : t("events.booking.full")}
        </p>
      </div>
      <Button
        size="lg"
        className="h-11 max-w-44 flex-1 rounded-xl bg-primary px-8 font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
        disabled={action.disabled}
        isLoading={action.isPending}
        onClick={action.onClick}
      >
        {action.label}
      </Button>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div aria-busy className="space-y-4">
      <Skeleton className="aspect-video w-full rounded-2xl" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}

export function EventDetailsPage() {
  const { t } = useTranslation();
  const { eventId } = route.useParams();
  const {
    data: event,
    isPending,
    isError,
    refetch,
  } = useGetEventApiV1EventsEventIdGet(eventId);

  if (isPending) {
    return (
      <PageContainer>
        <DetailsSkeleton />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer size="narrow">
        <StatusMessage
          title={t("events.details.notFound")}
          description={t("events.details.notFoundDescription")}
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
              >
                {t("common.retry")}
              </Button>
              <Link to="/events" className={buttonVariants({ size: "sm" })}>
                {t("events.details.backToEvents")}
              </Link>
            </div>
          }
        />
      </PageContainer>
    );
  }

  return (
    <>
      <MobileTopBar event={event} />

      <PageContainer className="max-lg:p-0 max-lg:pb-28 lg:pb-12">
        <div className="mb-6 hidden lg:block">
          <Breadcrumbs
            items={[
              { label: t("events.details.home"), to: "/" },
              { label: t("nav.events"), to: "/events" },
              { label: event.title },
            ]}
          />
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <div className="overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-card">
              <EventHero event={event} />
              <div className="space-y-5 px-4 pt-4 pb-6 lg:px-6 lg:pt-6 lg:pb-8">
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  {event.title}
                </h1>
                <div className="border-t border-border pt-5">
                  <EventFacts event={event} />
                </div>
              </div>
            </div>

            <div className="space-y-6 max-lg:px-4">
              <EventAbout description={event.description} />
              <OrganizerSection event={event} />
            </div>
          </div>

          <aside className="hidden lg:sticky lg:top-20 lg:block">
            <BookingCard event={event} />
          </aside>
        </div>
      </PageContainer>

      <MobileBookingBar event={event} />
    </>
  );
}
