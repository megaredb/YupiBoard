import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "@/shared/ui/button-variants";
import { StatusMessage } from "@/shared/ui/status-message";

export function EventCreatedMessage() {
  const { t } = useTranslation();

  return (
    <StatusMessage
      className="mt-6"
      title={t("events.create.successTitle")}
      description={t("events.create.successDescription")}
      action={
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/my-events" search={{ page: 1 }} className={buttonVariants({ size: "xl" })}>
            {t("events.create.toMyEvents")}
          </Link>
          <Link to="/events" className={buttonVariants({ variant: "outline", size: "xl" })}>
            {t("events.details.backToEvents")}
          </Link>
        </div>
      }
    />
  );
}
