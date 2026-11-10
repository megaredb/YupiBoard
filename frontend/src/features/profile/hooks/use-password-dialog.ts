import { useState } from "react";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { useChangePassword } from "@/features/profile/hooks/use-change-password";
import type { ChangePasswordFormValues } from "@/features/profile/schemas/change-password.schema";

interface PasswordDialog {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  changePassword: (values: ChangePasswordFormValues) => void;
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
