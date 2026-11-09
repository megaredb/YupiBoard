import { Link } from "@tanstack/react-router";
import { ChevronRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/ui/card";
import type { EventOrganizer } from "@/features/events/hooks/use-event-organizer";
import { UserAvatar } from "@/features/users";

export function MobileOrganizerRow({ organizer }: { organizer: EventOrganizer }) {
  const { t } = useTranslation();

  return (
    <Card className="rounded-2xl p-5 shadow-sm lg:hidden">
      <Card.Header className="p-0 pb-3">
        <Card.Title className="text-lg font-bold tracking-tight">
          {t("events.details.organizer")}
        </Card.Title>
      </Card.Header>
      <Card.Content className="p-0">
        <Link
          to="/users/$userId"
          params={{ userId: organizer.id }}
          className="flex min-h-11 items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <UserAvatar name={organizer.name} avatarUrl={organizer.avatarUrl} className="size-12" />
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-foreground">{organizer.name}</p>
              {organizer.rating && (
                <p className="flex items-center gap-1 text-xs font-medium text-rating">
                  <Star aria-hidden className="size-3.5 fill-rating" />
                  <span>
                    {t("events.details.organizerRatingShort", { rating: organizer.rating })}
                  </span>
                </p>
              )}
            </div>
          </div>
          <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
        </Link>
      </Card.Content>
    </Card>
  );
}
