import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { showToast } from "@/shared/lib/toast/toast-store";
import { useSignedInUser } from "@/features/auth";
import { ChangePasswordDialog } from "@/features/profile/components/change-password-dialog";
import { MobileProfileShortcuts } from "@/features/profile/components/mobile-profile-shortcuts";
import { ProfileAvatar } from "@/features/profile/components/profile-avatar";
import { ProfileBanner } from "@/features/profile/components/profile-banner";
import { ProfileDetails } from "@/features/profile/components/profile-details";
import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { ProfileSummaryCard } from "@/features/profile/components/profile-summary-card";
import { useChangePassword } from "@/features/profile/hooks/use-change-password";
import { useProfileEditMode } from "@/features/profile/hooks/use-profile-edit-mode";
import { useSaveProfile } from "@/features/profile/hooks/use-save-profile";
import { useProfileBio } from "@/features/profile/lib/profile-bio-store";
import type { ProfileFormValues } from "@/features/profile/schemas/profile.schema";
import { getDisplayName } from "@/features/users";

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useSignedInUser();
  const bio = useProfileBio();
  const editMode = useProfileEditMode();
  const [isPasswordOpen, setPasswordOpen] = useState(false);

  const handleSaved = () => {
    editMode.stopEditing();
    showToast(t("profile.updatedMessage"));
  };
  const { saveProfile, isPending, errorKey } = useSaveProfile(user.id, handleSaved);
  const handleClosePassword = () => setPasswordOpen(false);
  const password = useChangePassword(handleClosePassword);
  const handleOpenPassword = () => {
    password.reset();
    setPasswordOpen(true);
  };
  const handleSubmit = (values: ProfileFormValues, onError: (error: unknown) => void) =>
    saveProfile({ values, avatar: editMode.pickedAvatar, onError });

  return (
    <div className="space-y-6 pb-12">
      <ProfileBanner />
      <div className="mx-auto -mt-20 max-w-3xl space-y-6 px-4 sm:px-6">
        <ProfileSummaryCard
          user={user}
          name={getDisplayName(user)}
          avatar={
            <ProfileAvatar
              user={user}
              isEditing={editMode.isEditing}
              pickedAvatar={editMode.pickedAvatar}
              onPick={editMode.setPickedAvatar}
              isDisabled={isPending}
            />
          }
        />
        <MobileProfileShortcuts userId={user.id} />
        {errorKey && <FormAlert message={t(errorKey)} />}
        {editMode.isEditing ? (
          <ProfileEditForm
            user={user}
            bio={bio}
            isPending={isPending}
            onSubmit={handleSubmit}
            onCancel={editMode.stopEditing}
            onChangePassword={handleOpenPassword}
          />
        ) : (
          <ProfileDetails
            user={user}
            bio={bio}
            onEdit={editMode.startEditing}
            onChangePassword={handleOpenPassword}
          />
        )}
      </div>
      {isPasswordOpen && (
        <ChangePasswordDialog
          onClose={handleClosePassword}
          isPending={password.isPending}
          errorKey={password.errorKey}
          onSubmit={password.changePassword}
        />
      )}
    </div>
  );
}
