import type { ComponentProps } from "react"
import { MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { TextField } from "@/shared/components/text-field"
import { CITY_MAX_LENGTH } from "@/shared/lib/validators/city"
import { Button } from "@/shared/ui/button"
import { useLocateMe } from "@/features/profile/hooks/use-locate-me"

interface LocationFieldProps extends Omit<ComponentProps<typeof TextField>, "label"> {
  onLocated: (location: string) => void
}

/** City / address input with a "Use GPS" shortcut. */
export function LocationField({ onLocated, disabled, ...inputProps }: LocationFieldProps) {
  const { t } = useTranslation()
  const { locate, isLocating } = useLocateMe(onLocated)

  return (
    <TextField
      label={t("profile.fields.location")}
      autoComplete="address-level2"
      maxLength={CITY_MAX_LENGTH}
      startIcon={<MapPin />}
      hint={t("profile.locationEditHint")}
      disabled={disabled}
      endAdornment={
        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={locate}
          disabled={disabled || isLocating}
        >
          {isLocating ? t("profile.gpsLocating") : t("profile.useGps")}
        </Button>
      }
      {...inputProps}
    />
  )
}
