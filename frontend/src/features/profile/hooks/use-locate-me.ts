import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { formatDecimal } from "@/shared/lib/format/format-number";
import { showToast } from "@/shared/lib/toast/toast-store";
import { getCurrentPosition } from "@/shared/platform/geolocation";

const COORDINATE_DIGITS = 4;

/** Fills the location with the device position ("50.4501, 30.5234"). */
export function useLocateMe(onLocated: (location: string) => void): {
  locate: () => void;
  isLocating: boolean;
} {
  const { t } = useTranslation();
  const mutation = useMutation({
    mutationFn: getCurrentPosition,
    onSuccess: ({ lat, lon }) =>
      onLocated(
        `${formatDecimal(lat, COORDINATE_DIGITS)}, ${formatDecimal(lon, COORDINATE_DIGITS)}`,
      ),
    onError: () => showToast(t("profile.locationUnavailable"), { tone: "error" }),
  });
  return { locate: () => mutation.mutate(), isLocating: mutation.isPending };
}
