import { useResetPasswordApiV1AuthResetPasswordPost } from "@/shared/api/generated/endpoints/auth/auth";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import type { NewPasswordFormValues } from "@/features/auth/schemas/new-password.schema";

const BAD_REQUEST = 400;

interface UseResetPasswordResult {
  resetPassword: (values: NewPasswordFormValues) => void;
  isPending: boolean;
  isDone: boolean;
  /** The server refused the token itself (used, replaced or expired since the page opened). */
  isTokenRejected: boolean;
  errorKey: TranslationKey | null;
}

export function useResetPassword(token: string): UseResetPasswordResult {
  const mutation = useResetPasswordApiV1AuthResetPasswordPost();
  // A 400 without field errors is the backend's answer for every unusable token.
  const isTokenRejected =
    mutation.error?.status === BAD_REQUEST && mutation.error.fieldErrors === undefined;

  return {
    resetPassword: (values) => mutation.mutate({ data: { token, new_password: values.password } }),
    isPending: mutation.isPending,
    isDone: mutation.isSuccess,
    isTokenRejected,
    errorKey:
      mutation.isError && !isTokenRejected
        ? getApiErrorKey(mutation.error, "auth.resetPassword.failed")
        : null,
  };
}
