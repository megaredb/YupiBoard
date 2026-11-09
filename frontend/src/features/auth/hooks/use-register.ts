import { hasFieldErrors } from "@/shared/api/errors";
import { registerApiV1AuthRegisterPost } from "@/shared/api/generated/endpoints/auth/auth";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { useSignInMutation } from "@/features/auth/hooks/use-sign-in-mutation";
import { getSignInErrorKey } from "@/features/auth/lib/get-sign-in-error-key";
import type { RegisterFormValues } from "@/features/auth/schemas/register.schema";

interface UseRegisterResult {
  register: (values: RegisterFormValues, onError: (error: unknown) => void) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

export function useRegister(redirectTo: string | undefined): UseRegisterResult {
  const mutation = useSignInMutation(
    ({ email, password }: RegisterFormValues) => registerApiV1AuthRegisterPost({ email, password }),
    redirectTo,
  );
  return {
    register: (values, onError) => mutation.mutate(values, { onError }),
    isPending: mutation.isPending,
    errorKey:
      mutation.isError && !hasFieldErrors(mutation.error)
        ? getSignInErrorKey(mutation.error, "auth.register.failed", {
            409: "auth.register.emailTaken",
          })
        : null,
  };
}
