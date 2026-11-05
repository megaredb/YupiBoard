import { Link } from "@tanstack/react-router";
import { ArrowLeft, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { Button } from "@/shared/ui/button";
import { buttonVariants } from "@/shared/ui/button-variants";
import { StatusMessage } from "@/shared/ui/status-message";
import { CreateEventForm } from "@/features/events/components/create-event/create-event-form";
import { MobileTopBar } from "@/features/events/components/mobile-top-bar";
import { useCreateEvent } from "@/features/events/hooks/use-create-event";
import { useGoBack } from "@/features/events/hooks/use-go-back";

/** `/events/new`: a focused flow without the app header and footer. */
export function CreateEventPage() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const { createEvent, isPending, isCreated, errorKey } = useCreateEvent();

  return (
    <>
      <MobileTopBar onBack={goBack} title={t("events.create.title")} />
      <div className="mx-auto w-full max-w-2xl px-4 pb-12 lg:pt-safe">
        <div className="max-lg:hidden">
          <Link to="/events" className="mt-6 inline-flex items-center rounded-lg">
            <BrandLogo size="sm" />
          </Link>
          <div className="mt-5 flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              aria-label={t("common.back")}
              onClick={goBack}
            >
              <ArrowLeft aria-hidden />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{t("events.create.title")}</h1>
          </div>
        </div>

        {isCreated ? (
          <StatusMessage
            className="mt-6"
            title={t("events.create.successTitle")}
            description={t("events.create.successDescription")}
            action={
              <Link to="/events" className={buttonVariants({ size: "xl" })}>
                {t("events.details.backToEvents")}
              </Link>
            }
          />
        ) : (
          <>
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2.5 text-sm text-primary">
              <Info aria-hidden className="size-4 shrink-0" />
              {t("events.create.moderationBanner")}
            </p>
            <div className="mt-5">
              <CreateEventForm
                isPending={isPending}
                errorKey={errorKey}
                onSubmit={createEvent}
                onCancel={goBack}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
}
