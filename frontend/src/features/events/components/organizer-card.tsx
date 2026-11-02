import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/card";
import { UserAvatar } from "@/features/users";
import type { EventOrganizer } from "@/features/events/hooks/use-event-organizer";

/** Desktop "Meet your organizer" card. */
export function OrganizerCard({ organizer }: { organizer: EventOrganizer }) {
  const { t } = useTranslation();

  return (
    <Card className="hidden rounded-2xl p-6 shadow-sm lg:flex">
      <Card.Header className="p-0 pb-5">
        <Card.Title className="text-xl font-bold tracking-tight">
          {t("events.details.meetOrganizer")}
        </Card.Title>
      </Card.Header>
      <Card.Content className="flex items-center justify-between gap-4 p-0">
        <div className="flex items-center gap-4">
          <UserAvatar
            name={organizer.name}
            avatarUrl={organizer.avatarUrl}
            className="size-14"
            fallbackClassName="text-base"
          />
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{organizer.name}</p>
            {organizer.rating && (
              <p className="text-xs text-muted-foreground">
                {t("events.details.organizerRating", { rating: organizer.rating })}
              </p>
            )}
            {organizer.memberSince && (
              <p className="text-xs text-muted-foreground">
                {t("events.details.memberSince", { date: organizer.memberSince })}
              </p>
            )}
          </div>
        </div>
        <Link
          to="/users/$userId"
          params={{ userId: organizer.id }}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          <span>{t("events.details.viewProfile")}</span>
          <ArrowUpRight aria-hidden className="size-4" />
        </Link>
      </Card.Content>
    </Card>
  );
}
