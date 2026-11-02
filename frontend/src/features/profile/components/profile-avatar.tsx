import type { UserRead } from "@/shared/api/generated/model"
import { UserAvatar, getDisplayName } from "@/features/users"
import { AvatarPicker } from "@/features/profile/components/avatar-picker"

interface ProfileAvatarProps {
  user: UserRead
  isEditing: boolean
  pickedAvatar: File | null
  onPick: (file: File) => void
  isDisabled: boolean
}

/** Plain avatar in view mode, the picker (with preview) in edit mode. */
export function ProfileAvatar({
  user,
  isEditing,
  pickedAvatar,
  onPick,
  isDisabled,
}: ProfileAvatarProps) {
  const name = getDisplayName(user)
  if (!isEditing) {
    return <UserAvatar name={name} avatarUrl={user.avatar_url} className="size-16 sm:size-20" />
  }
  return (
    <AvatarPicker
      name={name}
      currentUrl={user.avatar_url}
      value={pickedAvatar}
      onChange={onPick}
      isDisabled={isDisabled}
      size="md"
    />
  )
}
