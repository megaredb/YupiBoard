import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { changePasswordApiV1UsersMeChangePasswordPost } from "@/shared/api/generated/endpoints/users/users";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import { renewSessionAfterPasswordChange } from "@/features/auth";
import type { ChangePasswordFormValues } from "@/features/profile/schemas/change-password.schema";

interface UseChangePasswordResult {
  changePassword: (values: ChangePasswordFormValues) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
  reset: () => void;
}

export function useChangePassword(onSuccess: () => void): UseChangePasswordResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ currentPassword, password }: ChangePasswordFormValues) => {
      await changePasswordApiV1UsersMeChangePasswordPost({
        old_password: currentPassword || null,
        new_password: password,
      });
      await renewSessionAfterPasswordChange(queryClient, password);
    },
    onSuccess: () => {
      showToast(t("profile.passwordDialog.success"));
      onSuccess();
    },
  });

  return {
    changePassword: (values) => mutation.mutate(values),
    isPending: mutation.isPending,
    errorKey: mutation.isError
      ? getApiErrorKey(mutation.error, "profile.passwordDialog.failed", {
          400: "profile.passwordDialog.wrongCurrentPassword",
        })
      : null,
    reset: mutation.reset,
  };
}
