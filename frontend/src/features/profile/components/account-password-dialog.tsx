import type { UserRead } from "@/shared/api/generated/model";
import { ChangePasswordDialog } from "@/features/profile/components/change-password-dialog";
import { SetPasswordDialog } from "@/features/profile/components/set-password-dialog";
import type { PasswordDialog } from "@/features/profile/hooks/use-password-dialog";

interface AccountPasswordDialogProps {
  user: UserRead;
  dialog: PasswordDialog;
}

/** Change password when the account has one; otherwise offer a reset link to set it. */
export function AccountPasswordDialog({ user, dialog }: AccountPasswordDialogProps) {
  if (!dialog.isOpen) return null;
  if (!user.has_password) {
    return (
      <SetPasswordDialog
        email={user.email}
        onClose={dialog.close}
        onSendLink={dialog.setPassword.sendLink}
        isPending={dialog.setPassword.isPending}
        sentTo={dialog.setPassword.sentTo}
        errorKey={dialog.setPassword.errorKey}
      />
    );
  }
  return (
    <ChangePasswordDialog
      onClose={dialog.close}
      isPending={dialog.isPending}
      errorKey={dialog.errorKey}
      onSubmit={dialog.changePassword}
    />
  );
}
