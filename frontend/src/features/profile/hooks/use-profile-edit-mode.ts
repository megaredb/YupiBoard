import { useState } from "react"

interface ProfileEditMode {
  isEditing: boolean
  /** New photo picked while editing; uploaded together with the form. */
  pickedAvatar: File | null
  setPickedAvatar: (file: File) => void
  startEditing: () => void
  stopEditing: () => void
}

export function useProfileEditMode(): ProfileEditMode {
  const [isEditing, setEditing] = useState(false)
  const [pickedAvatar, setPickedAvatar] = useState<File | null>(null)

  return {
    isEditing,
    pickedAvatar,
    setPickedAvatar,
    startEditing: () => setEditing(true),
    stopEditing: () => {
      setEditing(false)
      setPickedAvatar(null)
    },
  }
}
