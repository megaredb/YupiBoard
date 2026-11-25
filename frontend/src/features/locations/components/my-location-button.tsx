import { LocateFixed } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";
import { showToast } from "@/shared/lib/toast/toast-store";
import type { Coordinates } from "@/shared/platform/geolocation";
import { Button } from "@/shared/ui/button";
import { useCurrentPosition } from "@/features/locations/hooks/use-current-position";

interface MyLocationButtonProps {
  onFound: (position: Coordinates) => void;
  isGuest?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export function MyLocationButton({
  onFound,
  isGuest = false,
  isDisabled,
  className,
}: MyLocationButtonProps) {
  const { t } = useTranslation();
  const { locate, isLocating } = useCurrentPosition(onFound);
  const handleClick = () => {
    if (isGuest) {
      showToast(t("common.location.signInRequired"), { tone: "info" });
      return;
    }
    locate();
  };

  return (
    <Button
      type="button"
      variant="link"
      size="sm"
      isLoading={isLocating}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn("touch-hitbox h-auto px-0", className)}
    >
      {!isLocating && <LocateFixed aria-hidden />}
      {isLocating ? t("common.location.locating") : t("common.location.useMyLocation")}
    </Button>
  );
}
