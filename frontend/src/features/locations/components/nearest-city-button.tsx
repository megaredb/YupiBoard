import type { CityRead } from "@/shared/api/generated/model";
import type { Coordinates } from "@/shared/platform/geolocation";
import { MyLocationButton } from "@/features/locations/components/my-location-button";
import { useCities } from "@/features/locations/hooks/use-cities";
import { findNearestCity } from "@/features/locations/lib/find-nearest-city";

interface NearestCityButtonProps {
  onFound: (city: CityRead) => void;
  isDisabled?: boolean;
  className?: string;
}

export function NearestCityButton({ onFound, isDisabled, className }: NearestCityButtonProps) {
  const cities = useCities();
  const handleFound = (position: Coordinates) => {
    const city = findNearestCity(cities, position);
    if (city) onFound(city);
  };

  return <MyLocationButton onFound={handleFound} isDisabled={isDisabled} className={className} />;
}
