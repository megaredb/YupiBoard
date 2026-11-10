import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { CityRead } from "@/shared/api/generated/model";
import { showToast } from "@/shared/lib/toast/toast-store";
import { getCurrentPosition } from "@/shared/platform/geolocation";
import { useCities } from "@/features/locations/hooks/use-cities";
import { findNearestCity } from "@/features/locations/lib/find-nearest-city";

interface NearestCity {
  locate: () => void;
  isLocating: boolean;
}

export function useNearestCity(onFound: (city: CityRead) => void): NearestCity {
  const { t } = useTranslation();
  const cities = useCities();
  const mutation = useMutation({
    mutationFn: getCurrentPosition,
    onSuccess: (position) => {
      const city = findNearestCity(cities, position);
      if (city) onFound(city);
    },
    onError: () => showToast(t("common.location.unavailable"), { tone: "error" }),
  });
  return { locate: () => mutation.mutate(), isLocating: mutation.isPending };
}
