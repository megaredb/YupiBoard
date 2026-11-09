import { Lock } from "lucide-react";
import { FormProvider, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { UserRead } from "@/shared/api/generated/model";
import { FormField } from "@/shared/components/form-field";
import { TextField } from "@/shared/components/text-field";
import { useAppForm } from "@/shared/hooks/use-app-form";
import { useFieldError } from "@/shared/i18n/use-field-error";
import { applyServerFieldErrors } from "@/shared/lib/form/apply-server-field-errors";
import { CONTACT_INFO_MAX_LENGTH } from "@/shared/lib/validators/contact-info";
import { Card } from "@/shared/ui/card";
import { Textarea } from "@/shared/ui/textarea";
import { PersonNameFields } from "@/features/profile/components/person-name-fields";
import { ProfileCityField } from "@/features/profile/components/profile-city-field";
import { ProfileEditActions } from "@/features/profile/components/profile-edit-actions";
import {
  BIO_MAX_LENGTH,
  profileSchema,
  type ProfileFormValues,
} from "@/features/profile/schemas/profile.schema";

interface ProfileEditFormProps {
  user: UserRead;
  isPending: boolean;
  onSubmit: (values: ProfileFormValues, onError: (error: unknown) => void) => void;
  onCancel: () => void;
  onChangePassword: () => void;
}

const SERVER_FIELDS = ["first_name", "last_name", "bio", "city", "contact_info"] as const;

function toDefaultValues(user: UserRead): ProfileFormValues {
  return {
    first_name: user.first_name ?? "",
    last_name: user.last_name ?? "",
    bio: user.bio ?? "",
    contact_info: user.contact_info ?? "",
    city: user.city ?? "",
  };
}

/** Edit mode of "My profile" (ORG-5). */
export function ProfileEditForm(props: ProfileEditFormProps) {
  const { user, isPending } = props;
  const { t } = useTranslation();
  const fieldError = useFieldError();
  const form = useAppForm(profileSchema, { defaultValues: toDefaultValues(user) });
  const { errors } = form.formState;
  const bioLength = useWatch({ control: form.control, name: "bio" }).length;
  const submit = form.handleSubmit((values) =>
    props.onSubmit(values, (error) => applyServerFieldErrors(error, SERVER_FIELDS, form.setError)),
  );

  return (
    <Card size="lg">
      <Card.Content>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">{t("profile.editProfile")}</h2>
          <span className="text-xs text-muted-foreground">{t("common.requiredFields")}</span>
        </div>
        <FormProvider {...form}>
          <form noValidate className="mt-2 space-y-5" onSubmit={submit}>
            <PersonNameFields isPending={isPending} className="space-y-5" />
            <FormField
              label={t("profile.fields.bio")}
              optionalText={t("common.optional")}
              hint={t("profile.bioHint")}
              error={fieldError(errors.bio?.message)}
              counter={`${bioLength}/${BIO_MAX_LENGTH}`}
            >
              {(fieldControl) => (
                <Textarea
                  {...fieldControl}
                  maxLength={BIO_MAX_LENGTH}
                  disabled={isPending}
                  {...form.register("bio")}
                />
              )}
            </FormField>
            <TextField
              label={t("profile.fields.contactInfo")}
              autoComplete="tel"
              maxLength={CONTACT_INFO_MAX_LENGTH}
              error={fieldError(errors.contact_info?.message)}
              disabled={isPending}
              {...form.register("contact_info")}
            />
            <TextField
              label={t("profile.fields.email")}
              value={user.email}
              readOnly
              disabled
              startIcon={<Lock />}
              hint={t("profile.emailLinkedNote")}
            />
            <ProfileCityField savedCity={user.city} isPending={isPending} />
            <ProfileEditActions
              isPending={isPending}
              onCancel={props.onCancel}
              onChangePassword={props.onChangePassword}
            />
          </form>
        </FormProvider>
      </Card.Content>
    </Card>
  );
}
