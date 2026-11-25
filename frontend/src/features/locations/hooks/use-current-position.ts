import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { showToast } from "@/shared/lib/toast/toast-store";
import { getCurrentPosition, type Coordinates } from "@/shared/platform/geolocation";

interface CurrentPosition {
  locate: () => void;
  isLocating: boolean;
}

export function useCurrentPosition(onFound: (position: Coordinates) => void): CurrentPosition {
  const { t } = useTranslation();
  const mutation = useMutation({
    mutationFn: getCurrentPosition,
    onSuccess: onFound,
    onError: () => showToast(t("common.location.unavailable"), { tone: "error" }),
  });
  return { locate: () => mutation.mutate(), isLocating: mutation.isPending };
}
