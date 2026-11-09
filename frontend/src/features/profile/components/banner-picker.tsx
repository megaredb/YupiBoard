import { useId } from "react";
import { ImageUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useImageFilePicker } from "@/shared/hooks/use-image-file-picker";
import { useObjectUrl } from "@/shared/hooks/use-object-url";
import { cn } from "@/shared/lib/cn";
import { IMAGE_MIME_TYPES } from "@/shared/lib/image/image-constraints";
import { buttonVariants } from "@/shared/ui/button-variants";
import { ProfileBanner } from "@/features/profile/components/profile-banner";

interface BannerPickerProps {
  currentUrl: string | null | undefined;
  value: File | null;
  onChange: (file: File) => void;
  isDisabled: boolean;
}

export function BannerPicker({ currentUrl, value, onChange, isDisabled }: BannerPickerProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const previewUrl = useObjectUrl(value);
  const { handleFileChange, hasError } = useImageFilePicker("banner", onChange);

  return (
    <ProfileBanner imageUrl={previewUrl ?? currentUrl}>
      <div className="absolute inset-x-4 top-4 flex flex-col items-end gap-1.5 sm:inset-x-6">
        <input
          id={inputId}
          type="file"
          accept={IMAGE_MIME_TYPES.join(",")}
          className="peer sr-only"
          aria-describedby={hintId}
          disabled={isDisabled}
          onChange={handleFileChange}
        />
        <label
          htmlFor={inputId}
          className={buttonVariants({
            variant: "outline",
            size: "lg",
            className:
              "cursor-pointer bg-card/90 shadow-sm backdrop-blur-xs peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-disabled:pointer-events-none peer-disabled:opacity-50",
          })}
        >
          <ImageUp aria-hidden />
          {t("profile.changeBanner")}
        </label>
        <p
          id={hintId}
          role={hasError ? "alert" : undefined}
          className={cn(
            "rounded-md bg-card/90 px-2 py-1 text-xs backdrop-blur-xs",
            hasError ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {hasError ? t("validation.bannerFormatSize") : t("profile.bannerHint")}
        </p>
      </div>
    </ProfileBanner>
  );
}
