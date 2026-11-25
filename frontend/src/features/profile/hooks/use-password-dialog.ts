import { useState } from "react";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { usePasswordRecovery } from "@/features/auth";
import { useChangePassword } from "@/features/profile/hooks/use-change-password";
import type { ChangePasswordFormValues } from "@/features/profile/schemas/change-password.schema";

export interface PasswordDialog {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  changePassword: (values: ChangePasswordFormValues) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
  /** Accounts without a password (Google sign-up) get a reset link instead of the form. */
  setPassword: {
    sendLink: (email: string) => void;
    isPending: boolean;
    sentTo: string | null;
    errorKey: TranslationKey | null;
  };
}

export function usePasswordDialog(): PasswordDialog {
  const [isOpen, setOpen] = useState(false);
  const close = () => setOpen(false);
  const password = useChangePassword(close);
  const recovery = usePasswordRecovery();

  return {
    isOpen,
    open: () => {
      password.reset();
      recovery.reset();
      setOpen(true);
    },
    close,
    changePassword: password.changePassword,
    isPending: password.isPending,
    errorKey: password.errorKey,
    setPassword: {
      sendLink: (email) => recovery.requestRecovery({ email }),
      isPending: recovery.isPending,
      sentTo: recovery.sentTo,
      errorKey: recovery.errorKey && "profile.setPasswordDialog.failed",
    },
  };
}
