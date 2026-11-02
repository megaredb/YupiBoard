import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  updateCurrentUserProfileApiV1UsersMePatch,
  uploadAvatarApiV1UsersMeAvatarPost,
} from "@/shared/api/generated/endpoints/users/users"
import type { UserRead } from "@/shared/api/generated/model"
import { getApiErrorKey } from "@/shared/i18n/get-api-error-key"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { currentUserQueryOptions } from "@/features/auth"
import { toUserUpdate } from "@/features/profile/lib/to-user-update"
import type { CompleteProfileFormValues } from "@/features/profile/schemas/profile.schema"

interface ProfileUpdate {
  values: CompleteProfileFormValues
  /** Already validated and resized by the avatar picker. */
  avatar: File | null
}

interface UseUpdateProfileResult {
  updateProfile: (update: ProfileUpdate, options: { onError: (error: unknown) => void }) => void
  isPending: boolean
  errorKey: TranslationKey | null
}

/** Avatar upload + `PATCH /users/me`; the current user query is refreshed afterwards. */
export function useUpdateProfile(onSuccess: (user: UserRead) => void): UseUpdateProfileResult {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({ values, avatar }: ProfileUpdate) => {
      if (avatar) await uploadAvatarApiV1UsersMeAvatarPost({ file: avatar })
      return updateCurrentUserProfileApiV1UsersMePatch(toUserUpdate(values))
    },
    onSuccess: async (user) => {
      await queryClient.invalidateQueries({ queryKey: currentUserQueryOptions().queryKey })
      onSuccess(user)
    },
  })

  return {
    updateProfile: (update, { onError }) => mutation.mutate(update, { onError }),
    isPending: mutation.isPending,
    errorKey: mutation.isError ? getApiErrorKey(mutation.error, "profile.updateFailed") : null,
  }
}
