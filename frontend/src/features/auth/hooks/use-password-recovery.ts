import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePasswordRecoveryApiV1AuthPasswordRecoveryPost } from "@/shared/api/generated/endpoints/auth/auth";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { showToast } from "@/shared/lib/toast/toast-store";
import type { PasswordRecoveryFormValues } from "@/features/auth/schemas/password-recovery.schema";

interface UsePasswordRecoveryResult {
  requestRecovery: (values: PasswordRecoveryFormValues) => void;
  resend: () => void;
  isPending: boolean;
  sentTo: string | null;
  errorKey: TranslationKey | null;
  reset: () => void;
}

export function usePasswordRecovery(): UsePasswordRecoveryResult {
  const { t } = useTranslation();
  // Kept apart from the mutation so the "sent" view stays while a resend is in flight.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const mutation = usePasswordRecoveryApiV1AuthPasswordRecoveryPost({
    mutation: { onSuccess: (_response, { data }) => setSentTo(data.email) },
  });

  const handleResent = () => showToast(t("auth.recovery.resent"));

  return {
    requestRecovery: (values) => mutation.mutate({ data: { email: values.email } }),
    resend: () => {
      if (sentTo) mutation.mutate({ data: { email: sentTo } }, { onSuccess: handleResent });
    },
    isPending: mutation.isPending,
    sentTo,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "auth.recovery.failed") : null,
    reset: () => {
      setSentTo(null);
      mutation.reset();
    },
  };
}
