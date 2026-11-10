import { MailCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { Button } from "@/shared/ui/button";
import { Dialog } from "@/shared/ui/dialog";

interface PasswordRecoverySentProps {
  email: string;
  isPending: boolean;
  errorKey: TranslationKey | null;
  onResend: () => void;
  onChangeEmail: () => void;
  onClose: () => void;
}

const TIP_KEYS = [
  "auth.recovery.tipSpam",
  "auth.recovery.tipExpiry",
  "auth.recovery.tipLatest",
] as const satisfies readonly TranslationKey[];

export function PasswordRecoverySent({
  email,
  isPending,
  errorKey,
  onResend,
  onChangeEmail,
  onClose,
}: PasswordRecoverySentProps) {
  const { t } = useTranslation();

  return (
    <>
      <Dialog.Header className="items-center text-center">
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck aria-hidden className="size-6" />
        </div>
        <Dialog.Title>{t("auth.recovery.sentTitle")}</Dialog.Title>
        <Dialog.Description>{t("auth.recovery.sentMessage")}</Dialog.Description>
        <p className="max-w-full truncate rounded-lg bg-muted px-3 py-1.5 text-sm font-medium">
          {email}
        </p>
      </Dialog.Header>
      {errorKey && <FormAlert message={t(errorKey)} />}
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {TIP_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
      <Dialog.Footer className="sm:justify-between">
        <Button variant="link" className="px-0" onClick={onChangeEmail} disabled={isPending}>
          {t("auth.recovery.changeEmail")}
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onResend} isLoading={isPending}>
            {t("auth.recovery.resend")}
          </Button>
          <Button onClick={onClose}>{t("auth.recovery.done")}</Button>
        </div>
      </Dialog.Footer>
    </>
  );
}
