import { LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CityRead } from "@/shared/api/generated/model";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { useNearestCity } from "@/features/locations/hooks/use-nearest-city";

interface NearestCityButtonProps {
  onFound: (city: CityRead) => void;
  isDisabled?: boolean;
  className?: string;
}

/** "Use my location": chooses the supported city nearest to the device. */
export function NearestCityButton({ onFound, isDisabled, className }: NearestCityButtonProps) {
  const { t } = useTranslation();
  const { locate, isLocating } = useNearestCity(onFound);

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      isLoading={isLocating}
      disabled={isDisabled}
      onClick={locate}
      className={cn("h-auto px-0", className)}
    >
      {!isLocating && <LocateFixed aria-hidden />}
      {isLocating ? t("common.location.locating") : t("common.location.useMyLocation")}
    </Button>
  );
}
