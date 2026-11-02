import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { BrandLogo } from "@/shared/layout/brand-logo";
import { Card } from "@/shared/ui/card";
import { useSignedInUser } from "@/features/auth";
import { getDisplayName } from "@/features/users";
import { AvatarPicker } from "@/features/profile/components/avatar-picker";
import { CompleteProfileForm } from "@/features/profile/components/complete-profile-form";
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile";
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema";

export function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSignedInUser();
  const [avatar, setAvatar] = useState<File | null>(null);
  const handleSaved = () => void navigate({ to: "/events", replace: true });
  const { updateProfile, isPending, errorKey } = useUpdateProfile(handleSaved);
  const handleSubmit = (values: CompleteProfileFormValues, onError: (error: unknown) => void) =>
    updateProfile({ values, avatar }, { onError });

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-center justify-center px-4 py-8">
      <BrandLogo size="md" className="mb-6 max-sm:hidden" />
      <Card className="w-full rounded-2xl p-2 shadow-sm sm:p-6">
        <Card.Header className="justify-items-center space-y-2 text-center">
          <Card.Title className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("profile.complete.title")}
          </Card.Title>
          <Card.Description className="mx-auto max-w-sm">
            {t("profile.complete.subtitle")}
          </Card.Description>
        </Card.Header>
        <Card.Content className="space-y-6">
          <AvatarPicker
            name={getDisplayName(user)}
            currentUrl={user.avatar_url}
            value={avatar}
            onChange={setAvatar}
            isDisabled={isPending}
            variant="standalone"
          />
          {errorKey && <FormAlert message={t(errorKey)} />}
          <CompleteProfileForm user={user} isPending={isPending} onSubmit={handleSubmit} />
        </Card.Content>
      </Card>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        {t("profile.complete.footerNote")}
      </p>
    </div>
  );
}
