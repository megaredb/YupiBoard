import { useState } from "react";
import type { UserRead } from "@/shared/api/generated/model";
import { DeleteAccountSection } from "@/features/profile/components/delete-account-section";
import { MobileAccountDetailsSheet } from "@/features/profile/components/mobile-account-details-sheet";
import { MobileProfileShortcuts } from "@/features/profile/components/mobile-profile-shortcuts";
import { ProfileDetails } from "@/features/profile/components/profile-details";

interface ProfileOverviewProps {
  user: UserRead;
  onEdit: () => void;
  onChangePassword: () => void;
}

/** View mode: account details inline on desktop; on phones behind a shortcut, in a sheet. */
export function ProfileOverview({ user, onEdit, onChangePassword }: ProfileOverviewProps) {
  const [isDetailsSheetOpen, setDetailsSheetOpen] = useState(false);
  const handleOpenDetailsSheet = () => setDetailsSheetOpen(true);
  const handleEditFromSheet = () => {
    setDetailsSheetOpen(false);
    onEdit();
  };
  const handleChangePasswordFromSheet = () => {
    setDetailsSheetOpen(false);
    onChangePassword();
  };

  return (
    <>
      <MobileProfileShortcuts userId={user.id} onOpenAccountDetails={handleOpenDetailsSheet} />
      <ProfileDetails
        user={user}
        onEdit={onEdit}
        onChangePassword={onChangePassword}
        className="max-desktop:hidden"
      />
      <MobileAccountDetailsSheet
        user={user}
        isOpen={isDetailsSheetOpen}
        onOpenChange={setDetailsSheetOpen}
        onEdit={handleEditFromSheet}
        onChangePassword={handleChangePasswordFromSheet}
      />
      <DeleteAccountSection />
    </>
  );
}
