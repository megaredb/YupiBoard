import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "@/shared/platform/is-native";

export interface Coordinates {
  lat: number;
  lon: number;
}

const TIMEOUT_MS = 8000;

function readWebPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      reject,
      { timeout: TIMEOUT_MS },
    );
  });
}

/** Only the nearest city is needed, so a recent fix is as good as a new one. */
const NATIVE_MAX_AGE_MS = 5 * 60_000;
/** A first GPS fix takes longer than a network lookup. */
const NATIVE_TIMEOUT_MS = 20_000;

/**
 * High accuracy lets Android use GPS: approximate location is a network lookup and never answers
 * on a phone without internet. On a connected phone the fused provider still answers from Wi-Fi.
 */
async function readNativePosition(): Promise<Coordinates> {
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    maximumAge: NATIVE_MAX_AGE_MS,
    timeout: NATIVE_TIMEOUT_MS,
  });
  return { lat: position.coords.latitude, lon: position.coords.longitude };
}

/** Rejects when the position is unavailable or permission is denied. */
export function getCurrentPosition(): Promise<Coordinates> {
  return isNativePlatform() ? readNativePosition() : readWebPosition();
}
