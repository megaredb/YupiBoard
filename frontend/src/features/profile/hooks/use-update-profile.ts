import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateCurrentUserProfileApiV1UsersMePatch,
  uploadAvatarApiV1UsersMeAvatarPost,
  uploadBannerApiV1UsersMeBannerPost,
} from "@/shared/api/generated/endpoints/users/users";
import type { UserRead } from "@/shared/api/generated/model";
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key";
import type { TranslationKey } from "@/shared/i18n/translation-key";
import { currentUserQueryOptions } from "@/features/auth";
import { toUserUpdate } from "@/features/profile/lib/to-user-update";
import type { ProfileUpdateValues } from "@/features/profile/schemas/profile.schema";

interface ProfileUpdate {
  values: ProfileUpdateValues;
  /** Already validated and resized by the avatar picker. */
  avatar: File | null;
  /** Already validated and resized by the banner picker; only "My profile" offers it. */
  banner?: File | null;
}

interface UseUpdateProfileResult {
  updateProfile: (update: ProfileUpdate, options: { onError: (error: unknown) => void }) => void;
  isPending: boolean;
  errorKey: TranslationKey | null;
}

export function useUpdateProfile(onSuccess: (user: UserRead) => void): UseUpdateProfileResult {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ values, avatar, banner }: ProfileUpdate) => {
      await Promise.all([
        avatar && uploadAvatarApiV1UsersMeAvatarPost({ file: avatar }),
        banner && uploadBannerApiV1UsersMeBannerPost({ file: banner }),
      ]);
      return updateCurrentUserProfileApiV1UsersMePatch(toUserUpdate(values));
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryOptions().queryKey });
      onSuccess(user);
    },
  });

  return {
    updateProfile: (update, { onError }) => mutation.mutate(update, { onError }),
    isPending: mutation.isPending,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "profile.updateFailed") : null,
  };
}
