import { Geolocation } from "@capacitor/geolocation";
import { isNativePlatform } from "@/shared/platform/is-native";

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Only the nearest city is needed, so a recent fix is as good as a new one. It also keeps repeated
 * lookups working on the web: with `maximumAge: 0` the browser waits for a fresh fix, and its
 * network provider only produces one when the Wi-Fi/IP data changes, so every call after the
 * first runs into the timeout.
 */
const MAX_POSITION_AGE_MS = 5 * 60_000;
const WEB_TIMEOUT_MS = 8000;
/** A first GPS fix takes longer than a network lookup. */
const NATIVE_TIMEOUT_MS = 20_000;

function readWebPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      reject,
      { maximumAge: MAX_POSITION_AGE_MS, timeout: WEB_TIMEOUT_MS },
    );
  });
}

/**
 * High accuracy lets Android use GPS: approximate location is a network lookup and never answers
 * on a phone without internet. On a connected phone the fused provider still answers from Wi-Fi.
 */
async function readNativePosition(): Promise<Coordinates> {
  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
    maximumAge: MAX_POSITION_AGE_MS,
    timeout: NATIVE_TIMEOUT_MS,
  });
  return { lat: position.coords.latitude, lon: position.coords.longitude };
}

/** Rejects when the position is unavailable or permission is denied. */
export function getCurrentPosition(): Promise<Coordinates> {
  return isNativePlatform() ? readNativePosition() : readWebPosition();
}
