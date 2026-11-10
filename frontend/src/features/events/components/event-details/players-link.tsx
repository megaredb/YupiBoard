import type { MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/button-variants";
import { PARTICIPANTS_SECTION_ID } from "@/features/events/lib/participants-section-id";

interface PlayersLinkProps {
  eventId: string;
  isCompact?: boolean;
  className?: string;
}

export function PlayersLink({ eventId, isCompact = false, className }: PlayersLinkProps) {
  const { t } = useTranslation();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const section = document.getElementById(PARTICIPANTS_SECTION_ID);
    if (section) {
      event.preventDefault();
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId }}
      search={(previous) => previous}
      hash={PARTICIPANTS_SECTION_ID}
      onClick={handleClick}
      className={cn(buttonVariants({ size: "xl" }), "text-sm shadow-sm", className)}
    >
      <Users aria-hidden />
      {isCompact ? t("events.booking.players") : t("events.booking.goToPlayers")}
    </Link>
  );
}
