import { usePasswordRecoveryApiV1AuthPasswordRecoveryPost } from "@/shared/api/generated/endpoints/auth/auth";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import type { PasswordRecoveryFormValues } from "@/features/auth/schemas/password-recovery.schema";

interface UsePasswordRecoveryResult {
  requestRecovery: (values: PasswordRecoveryFormValues) => void;
  isPending: boolean;
  isSent: boolean;
  errorKey: TranslationKey | null;
  reset: () => void;
}

export function usePasswordRecovery(): UsePasswordRecoveryResult {
  const mutation = usePasswordRecoveryApiV1AuthPasswordRecoveryPost();
  return {
    requestRecovery: (values) => mutation.mutate({ data: { email: values.email } }),
    isPending: mutation.isPending,
    isSent: mutation.isSuccess,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "auth.recovery.failed") : null,
    reset: mutation.reset,
  };
}
