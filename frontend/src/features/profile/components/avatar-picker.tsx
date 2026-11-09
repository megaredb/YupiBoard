import { useId, useRef } from "react";
import { cva } from "class-variance-authority";
import { Camera } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InlineError } from "@/shared/components/inline-error";
import { useImageFilePicker } from "@/shared/hooks/use-image-file-picker";
import { useObjectUrl } from "@/shared/hooks/use-object-url";
import { IMAGE_MIME_TYPES } from "@/shared/lib/image/image-constraints";
import { Button } from "@/shared/ui/button";
import { UserAvatar } from "@/features/users";

interface AvatarPickerProps {
  name: string;
  currentUrl: string | null | undefined;
  value: File | null;
  onChange: (file: File) => void;
  isDisabled: boolean;
  /** `standalone`: large, centred, with an upload button. `inline`: compact, inside a profile card. */
  variant: "standalone" | "inline";
}

const pickerVariants = cva("flex flex-col items-center gap-2", {
  variants: { variant: { standalone: "", inline: "sm:items-start" } },
});

const avatarVariants = cva("", {
  variants: { variant: { standalone: "size-24 sm:size-28", inline: "size-16 sm:size-20" } },
});

export function AvatarPicker({
  name,
  currentUrl,
  value,
  onChange,
  isDisabled,
  variant,
}: AvatarPickerProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useObjectUrl(value);
  const { handleFileChange, hasError } = useImageFilePicker("avatar", onChange);
  const handleBrowse = () => inputRef.current?.click();

  return (
    <div className={pickerVariants({ variant })}>
      <div className="relative">
        <UserAvatar
          name={name}
          avatarUrl={previewUrl ?? currentUrl}
          className={avatarVariants({ variant })}
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
        ref={inputRef}
        id={inputId}
        type="file"
        accept={IMAGE_MIME_TYPES.join(",")}
        className="sr-only"
        disabled={isDisabled}
        onChange={handleFileChange}
      />
      {variant === "standalone" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isDisabled}
          onClick={handleBrowse}
        >
          {t("profile.uploadPhoto")}
        </Button>
      )}
      <p className="text-xs text-muted-foreground">{t("profile.photoHint")}</p>
      {hasError && <InlineError message={t("validation.photoFormatSize")} />}
    </div>
  );
}
