import { useTranslation } from "react-i18next"
import { useChangePasswordApiV1UsersMeChangePasswordPost } from "@/shared/api/generated/endpoints/users/users"
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { showToast } from "@/shared/lib/toast/toast-store"
import type { NewPasswordFormValues } from "@/features/auth"

interface UseChangePasswordResult {
  changePassword: (values: NewPasswordFormValues) => void
  isPending: boolean
  errorKey: TranslationKey | null
  reset: () => void
}

export function useChangePassword(onSuccess: () => void): UseChangePasswordResult {
  const { t } = useTranslation()
  const mutation = useChangePasswordApiV1UsersMeChangePasswordPost({
    mutation: {
      onSuccess: () => {
        showToast(t("profile.passwordDialog.success"))
        onSuccess()
      },
    },
  })

  return {
    changePassword: (values) => mutation.mutate({ data: { new_password: values.password } }),
    isPending: mutation.isPending,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "profile.updateFailed") : null,
    reset: mutation.reset,
  }
}
