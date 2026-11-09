import type { CityRead } from "@/shared/api/generated/model";
import { useCurrentUser } from "@/features/auth";
import { useCities } from "@/features/locations/hooks/use-cities";
import { getPreferredCity } from "@/features/locations/lib/find-city";

/** The signed-in user's city when it is supported, otherwise the app's default city. */
export function usePreferredCity(): CityRead | undefined {
  const user = useCurrentUser();
  return getPreferredCity(useCities(), user?.city);
}
