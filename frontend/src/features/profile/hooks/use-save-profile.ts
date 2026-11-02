import type { UserRead } from "@/shared/api/generated/model"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { useUpdateProfile } from "@/features/profile/hooks/use-update-profile"
import { saveProfileBio } from "@/features/profile/lib/profile-bio-store"
import type { ProfileFormValues } from "@/features/profile/schemas/profile.schema"

interface SaveProfileInput {
  values: ProfileFormValues
  avatar: File | null
  onError: (error: unknown) => void
}

interface UseSaveProfileResult {
  saveProfile: (input: SaveProfileInput) => void
  isPending: boolean
  errorKey: TranslationKey | null
}

/** Profile edit: server fields through the API, the bio through its device-only adapter. */
export function useSaveProfile(
  userId: string,
  onSaved: (user: UserRead) => void,
): UseSaveProfileResult {
  const { updateProfile, isPending, errorKey } = useUpdateProfile(onSaved)

  return {
    saveProfile: ({ values: { bio, ...serverValues }, avatar, onError }) => {
      void saveProfileBio(userId, bio)
      updateProfile({ values: serverValues, avatar }, { onError })
    },
    isPending,
    errorKey,
  }
}
