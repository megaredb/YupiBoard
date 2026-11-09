import { useTranslation } from "react-i18next";
import { FormAlert } from "@/shared/components/form-alert";
import { showToast } from "@/shared/lib/toast/toast-store";
import { useSignedInUser } from "@/features/auth";
import { BannerPicker } from "@/features/profile/components/banner-picker";
import { ChangePasswordDialog } from "@/features/profile/components/change-password-dialog";
import { MobileProfileShortcuts } from "@/features/profile/components/mobile-profile-shortcuts";
import { ProfileAvatar } from "@/features/profile/components/profile-avatar";
import { ProfileBanner } from "@/features/profile/components/profile-banner";
import { ProfileDetails } from "@/features/profile/components/profile-details";
import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { ProfileSummaryCard } from "@/features/profile/components/profile-summary-card";
import { usePasswordDialog } from "@/features/profile/hooks/use-password-dialog";
import { useProfileEditMode } from "@/features/profile/hooks/use-profile-edit-mode";
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile";
import type { ProfileFormValues } from "@/features/profile/schemas/profile.schema";
import { getDisplayName } from "@/features/users";

export function ProfilePage() {
  const { t } = useTranslation();
  const user = useSignedInUser();
  const editMode = useProfileEditMode();
  const password = usePasswordDialog();

  const handleSaved = () => {
    editMode.stopEditing();
    showToast(t("profile.updatedMessage"));
  };
  const { updateProfile, isPending, errorKey } = useUpdateProfile(handleSaved);
  const handleSubmit = (values: ProfileFormValues, onError: (error: unknown) => void) =>
    updateProfile(
      { values, avatar: editMode.pickedAvatar, banner: editMode.pickedBanner },
      { onError },
    );

  return (
    <div className="space-y-6 pb-12">
      {editMode.isEditing ? (
        <BannerPicker
          currentUrl={user.banner_url}
          value={editMode.pickedBanner}
          onChange={editMode.setPickedBanner}
          isDisabled={isPending}
        />
      ) : (
        <ProfileBanner imageUrl={user.banner_url} />
      )}
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
            isPending={isPending}
            onSubmit={handleSubmit}
            onCancel={editMode.stopEditing}
            onChangePassword={password.open}
          />
        ) : (
          <ProfileDetails
            user={user}
            onEdit={editMode.startEditing}
            onChangePassword={password.open}
          />
        )}
      </div>
      {password.isOpen && (
        <ChangePasswordDialog
          onClose={password.close}
          isPending={password.isPending}
          errorKey={password.errorKey}
          onSubmit={password.changePassword}
        />
      )}
    </div>
  );
}
