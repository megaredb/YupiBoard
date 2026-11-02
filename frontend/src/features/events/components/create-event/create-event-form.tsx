import { ShieldCheck } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { useAppForm } from "@/shared/hooks/use-app-form";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { Button } from "@/shared/ui/button";
import { CoverSection } from "@/features/events/components/create-event/cover-section";
import { GeneralSection } from "@/features/events/components/create-event/general-section";
import { PlayersSection } from "@/features/events/components/create-event/players-section";
import { ScheduleSection } from "@/features/events/components/create-event/schedule-section";
import { DEFAULT_CITY_ID } from "@/features/events/lib/cities";
import {
  CREATE_EVENT_LIMITS,
  createEventSchema,
  type CreateEventFormInput,
  type CreateEventFormValues,
} from "@/features/events/schemas/create-event.schema";

interface CreateEventFormProps {
  isPending: boolean;
  errorKey: TranslationKey | null;
  onSubmit: (values: CreateEventFormValues) => void;
  onCancel: () => void;
}

const DEFAULT_VALUES: CreateEventFormInput = {
  title: "",
  gameTitle: "",
  description: "",
  date: "",
  time: "",
  city: DEFAULT_CITY_ID,
  address: "",
  maxPlayers: CREATE_EVENT_LIMITS.playersMin,
  price: 0,
  coverImage: null,
};

export function CreateEventForm({ isPending, errorKey, onSubmit, onCancel }: CreateEventFormProps) {
  const { t } = useTranslation();
  const form = useAppForm(createEventSchema, { defaultValues: DEFAULT_VALUES });

  return (
    <FormProvider {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <GeneralSection />
        <ScheduleSection />
        <PlayersSection />
        <CoverSection />
        {errorKey && <FormAlert message={t(errorKey)} />}

        <div className="space-y-3 border-t pt-5">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("common.requiredFields")}</p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="xl"
                className="flex-1 sm:flex-none"
                onClick={onCancel}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" size="xl" className="flex-1 sm:flex-none" isLoading={isPending}>
                {t("events.create.submit")}
              </Button>
            </div>
          </div>
          <p className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden className="size-3.5" />
            {t("events.create.reviewNote")}
          </p>
        </div>
      </form>
    </FormProvider>
  );
}
