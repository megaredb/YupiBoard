import type { MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { EventRead } from "@/shared/api/generated/model";
import { openExternalUrl } from "@/shared/platform/external-link";
import { getEventMapUrl } from "@/features/events/lib/get-event-map-url";

export function EventMapLink({ event }: { event: Pick<EventRead, "address" | "city"> }) {
  const { t } = useTranslation();
  const url = getEventMapUrl(event);
  const handleOpenMap = (clickEvent: MouseEvent<HTMLAnchorElement>) => {
    clickEvent.preventDefault();
    openExternalUrl(url);
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleOpenMap}
      className="inline-flex items-center gap-1 text-primary hover:underline"
    >
      {[event.address, event.city].filter(Boolean).join(", ")}
      <ArrowUpRight aria-hidden className="size-3.5 shrink-0" />
      <span className="sr-only">{t("events.details.opensMap")}</span>
    </a>
  );
}
