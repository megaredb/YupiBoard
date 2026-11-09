import { useState } from "react";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import type { NewPasswordFormValues } from "@/features/auth";
import { useChangePassword } from "@/features/profile/hooks/use-change-password";

interface PasswordDialog {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  changePassword: (values: NewPasswordFormValues) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

export function usePasswordDialog(): PasswordDialog {
  const [isOpen, setOpen] = useState(false);
  const close = () => setOpen(false);
  const password = useChangePassword(close);

  return {
    isOpen,
    open: () => {
      password.reset();
      setOpen(true);
    },
    close,
    changePassword: password.changePassword,
    isPending: password.isPending,
    errorKey: password.errorKey,
  };
}
