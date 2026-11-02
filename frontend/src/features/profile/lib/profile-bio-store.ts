// INTERIM: the backend must provide `bio` on UserRead and accept it in UserUpdate. Until then the
// bio is kept on this device only, per user (wiped on logout), and labelled as such in the UI.
import { create } from "zustand"
import { readUserValue, writeUserValue } from "@/shared/platform/storage"

const STORAGE_KEY = "profile-bio"

interface ProfileBioState {
  userId: string | null
  bio: string
}

const EMPTY_STATE: ProfileBioState = { userId: null, bio: "" }

const useProfileBioStore = create<ProfileBioState>(() => EMPTY_STATE)

export async function loadProfileBio(userId: string): Promise<void> {
  if (useProfileBioStore.getState().userId === userId) return
  const bio = (await readUserValue(userId, STORAGE_KEY)) ?? ""
  useProfileBioStore.setState({ userId, bio })
}

export async function saveProfileBio(userId: string, bio: string): Promise<void> {
  useProfileBioStore.setState({ userId, bio })
  await writeUserValue(userId, STORAGE_KEY, bio)
}

export function resetProfileBio(): void {
  useProfileBioStore.setState(EMPTY_STATE)
}

export function useProfileBio(): string {
  return useProfileBioStore((state) => state.bio)
}
