import { Link } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { buttonVariants } from "@/shared/ui/button-variants";
import { PARTICIPANTS_SECTION_ID } from "@/features/events/lib/participants-section-id";

interface PlayersLinkProps {
  eventId: string;
  className?: string;
}

/** The host's shortcut to the participants and booking requests further down the page. */
export function PlayersLink({ eventId, className }: PlayersLinkProps) {
  const { t } = useTranslation();

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId }}
      search={(previous) => previous}
      hash={PARTICIPANTS_SECTION_ID}
      hashScrollIntoView={{ behavior: "smooth", block: "start" }}
      className={cn(buttonVariants({ size: "xl" }), "shadow-sm", className)}
    >
      <Users aria-hidden />
      {t("events.booking.goToPlayers")}
    </Link>
  );
}
