import { useResetPasswordApiV1AuthResetPasswordPost } from "@/shared/api/generated/endpoints/auth/auth";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import type { NewPasswordFormValues } from "@/features/auth/schemas/new-password.schema";

interface UseResetPasswordResult {
  resetPassword: (values: NewPasswordFormValues) => void;
  isPending: boolean;
  isDone: boolean;
  errorKey: TranslationKey | null;
}

export function useResetPassword(token: string): UseResetPasswordResult {
  const mutation = useResetPasswordApiV1AuthResetPasswordPost();
  return {
    resetPassword: (values) => mutation.mutate({ data: { token, new_password: values.password } }),
    isPending: mutation.isPending,
    isDone: mutation.isSuccess,
    errorKey: mutation.isError
      ? getApiErrorKey(mutation.error, "auth.resetPassword.failed", {
          400: "auth.resetPassword.invalidToken",
        })
      : null,
  };
}
