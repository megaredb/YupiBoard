import { loginApiV1AuthLoginPost } from "@/shared/api/generated/endpoints/auth/auth";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { useSignInMutation } from "@/features/auth/hooks/use-sign-in-mutation";
import { getSignInErrorKey } from "@/features/auth/lib/get-sign-in-error-key";
import type { LoginFormValues } from "@/features/auth/schemas/login.schema";

interface UseLoginResult {
  login: (values: LoginFormValues) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

export function useLogin(redirectTo: string | undefined): UseLoginResult {
  const mutation = useSignInMutation(
    (values: LoginFormValues) => loginApiV1AuthLoginPost(values),
    redirectTo,
  );
  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    errorKey: mutation.isError
      ? getSignInErrorKey(mutation.error, "auth.login.failed", {
          401: "auth.login.invalidCredentials",
        })
      : null,
  };
}
