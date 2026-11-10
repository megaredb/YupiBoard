import type { ReactNode } from "react";
import { Calendar, MapPin, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import {
  formatLongDate,
  formatTimeRange,
  formatTimeZoneName,
} from "@/shared/lib/format/format-date";
import { SeatsProgress } from "@/shared/ui/seats-progress";
import { EventMapLink } from "@/features/events/components/event-details/event-map-link";

function Fact({ icon, title, detail }: { icon: ReactNode; title: string; detail: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-foreground sm:text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

export function EventFacts({ event }: { event: EventRead }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-10 gap-y-4">
        <Fact
          icon={<Calendar aria-hidden />}
          title={formatLongDate(event.start_datetime)}
          detail={t("events.details.timeWithZone", {
            time: formatTimeRange(event.start_datetime, event.end_datetime),
            zone: formatTimeZoneName(event.start_datetime),
          })}
        />
        <Fact
          icon={<MapPin aria-hidden />}
          title={event.location_name || event.city}
          detail={<EventMapLink event={event} />}
        />
      </div>

      <div className="space-y-2.5 rounded-2xl border border-border/60 bg-muted/40 p-4 desktop:hidden">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Users aria-hidden className="size-4" />
          <span>
            {t("events.details.playersJoined", {
              taken: event.current_confirmed,
              total: event.max_players,
            })}
          </span>
        </p>
        <SeatsProgress
          taken={event.current_confirmed}
          total={event.max_players}
          label={t("events.details.seatsProgress")}
        />
      </div>
    </div>
  );
}
