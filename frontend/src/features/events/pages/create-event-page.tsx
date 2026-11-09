import { useTranslation } from "react-i18next";
import { Breadcrumbs } from "@/shared/components/breadcrumbs";
import { FormAlert } from "@/shared/components/form-alert";
import { PageContainer } from "@/shared/layout/page-container";
import { PageHeader } from "@/shared/layout/page-header";
import { useSignedInUser } from "@/features/auth";
import { CreateEventForm } from "@/features/events/components/create-event/create-event-form";
import { EventCreatedMessage } from "@/features/events/components/create-event/event-created-message";
import { MobileTopBar } from "@/features/events/components/mobile-top-bar";
import { useCreateEvent } from "@/features/events/hooks/use-create-event";
import { useGoBack } from "@/features/events/hooks/use-go-back";

/** `/events/new` (immersive): the app header on desktop, its own top bar on phones. */
export function CreateEventPage() {
  const { t } = useTranslation();
  const goBack = useGoBack();
  const user = useSignedInUser();
  const { createEvent, isPending, isCreated, errorKey } = useCreateEvent();

  return (
    <>
      <MobileTopBar onBack={goBack} title={t("events.create.title")} />
      <PageContainer size="narrow" className="pb-12 max-desktop:pt-4">
        <div className="max-desktop:hidden">
          <Breadcrumbs
            className="mb-4"
            label={t("common.breadcrumbs")}
            items={[
              { label: t("shell.nav.events"), to: "/events" },
              { label: t("events.create.title") },
            ]}
          />
          <PageHeader title={t("events.create.title")} />
        </div>

        {isCreated ? (
          <EventCreatedMessage />
        ) : (
          <>
            <FormAlert
              tone="info"
              className="desktop:mt-5"
              message={t("events.create.moderationBanner")}
            />
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
      </PageContainer>
    </>
  );
}
