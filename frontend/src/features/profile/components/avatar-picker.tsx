import { useId, useState, type ChangeEvent } from "react"
import { cva } from "class-variance-authority"
import { Camera, CircleAlert } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useObjectUrl } from "@/shared/hooks/use-object-url"
import type { TranslationKey } from "@/shared/i18n/translation-key"
import { IMAGE_MIME_TYPES } from "@/shared/lib/image/image-constraints"
import { prepareImage } from "@/shared/lib/image/prepare-image"
import { UserAvatar } from "@/features/users"

interface AvatarPickerProps {
  name: string
  currentUrl: string | null | undefined
  value: File | null
  onChange: (file: File) => void
  isDisabled: boolean
  size: "md" | "lg"
}

const avatarVariants = cva("", {
  variants: { size: { md: "size-16 sm:size-20", lg: "size-24 sm:size-28" } },
})

/** Picks, validates and downsizes a new photo through the shared image pipeline. */
export function AvatarPicker({
  name,
  currentUrl,
  value,
  onChange,
  isDisabled,
  size,
}: AvatarPickerProps) {
  const { t } = useTranslation()
  const inputId = useId()
  const previewUrl = useObjectUrl(value)
  const [errorKey, setErrorKey] = useState<TranslationKey | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    const result = await prepareImage(file, "avatar")
    setErrorKey(result.status === "ok" ? null : "validation.photoFormatSize")
    if (result.status === "ok") onChange(result.file)
  }

  return (
    <div className="flex flex-col items-center gap-2 sm:items-start">
      <div className="relative">
        <UserAvatar
          name={name}
          avatarUrl={previewUrl ?? currentUrl}
          className={avatarVariants({ size })}
          fallbackClassName="text-xl font-bold"
        />
        <label
          htmlFor={inputId}
          aria-label={t("profile.changePhoto")}
          className="touch-hitbox absolute right-0 bottom-0 flex size-8 cursor-pointer items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-xs"
        >
          <Camera aria-hidden className="size-4" />
        </label>
      </div>
      <input
        id={inputId}
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        disabled={isDisabled}
        onChange={(event) => void handleFileChange(event)}
      />
      <p className="text-xs text-muted-foreground">{t("profile.photoHint")}</p>
      {errorKey && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <CircleAlert aria-hidden className="size-3.5 shrink-0" />
          <span>{t(errorKey)}</span>
        </p>
      )}
    </div>
  )
}
