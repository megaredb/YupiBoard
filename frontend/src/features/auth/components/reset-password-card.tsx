import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NewPasswordForm } from "@/features/auth/components/new-password-form";
import type { NewPasswordFormValues } from "@/features/auth/schemas/new-password.schema";

interface ResetPasswordCardProps {
  isPending: boolean;
  errorKey: TranslationKey | null;
  onSubmit: (values: NewPasswordFormValues) => void;
}

export function ResetPasswordCard({ isPending, errorKey, onSubmit }: ResetPasswordCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-full rounded-2xl p-2 shadow-sm sm:p-4">
      <Card.Header className="text-center">
        <Card.Title className="text-2xl font-bold tracking-tight">
          {t("auth.resetPassword.title")}
        </Card.Title>
        <Card.Description>{t("auth.resetPassword.subtitle")}</Card.Description>
      </Card.Header>
      <Card.Content className="space-y-4">
        {errorKey && <FormAlert message={t(errorKey)} />}
        <NewPasswordForm
          isPending={isPending}
          onSubmit={onSubmit}
          actions={
            <Button type="submit" size="xl" className="w-full text-sm" isLoading={isPending}>
              {t("auth.resetPassword.submit")}
            </Button>
          }
        />
      </Card.Content>
      <Card.Footer className="justify-center border-0 bg-transparent">
        <Link to="/login" className="text-xs font-medium text-primary hover:underline">
          {t("auth.resetPassword.backToLogin")}
        </Link>
      </Card.Footer>
    </Card>
  );
}
