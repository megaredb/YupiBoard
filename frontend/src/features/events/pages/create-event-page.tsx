import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { Button } from "@/shared/ui/button";
import { useSignedInUser } from "@/features/auth";
import { CreateEventForm } from "@/features/events/components/create-event/create-event-form";
import { EventCreatedMessage } from "@/features/events/components/create-event/event-created-message";
import { MobileTopBar } from "@/features/events/components/mobile-top-bar";
import { useCreateEvent } from "@/features/events/hooks/use-create-event";
import { useGoBack } from "@/features/events/hooks/use-go-back";

/** `/events/new`: a focused flow without the app header and footer. */
export function CreateEventPage() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const user = useSignedInUser();
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
          <EventCreatedMessage />
        ) : (
          <>
            <FormAlert tone="info" className="mt-4" message={t("events.create.moderationBanner")} />
            {!user.is_verified && (
              <FormAlert
                tone="warning"
                className="mt-3"
                message={t("events.create.verifyEmailRequired", { email: user.email })}
              />
            )}
            <div className="mt-5">
              <CreateEventForm
                isPending={isPending}
                isDisabled={!user.is_verified}
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
