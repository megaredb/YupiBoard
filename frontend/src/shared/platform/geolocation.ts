import { Geolocation } from "@capacitor/geolocation"
import { isNativePlatform } from "@/shared/platform/is-native"

export interface Coordinates {
  lat: number
  lon: number
}

const TIMEOUT_MS = 8000

function readWebPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not available"))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude }),
      reject,
      { timeout: TIMEOUT_MS },
    )
  })
}

async function readNativePosition(): Promise<Coordinates> {
  const permission = await Geolocation.requestPermissions({ permissions: ["coarseLocation"] })
  if (permission.coarseLocation === "denied") throw new Error("Location permission denied")
  const position = await Geolocation.getCurrentPosition({ timeout: TIMEOUT_MS })
  return { lat: position.coords.latitude, lon: position.coords.longitude }
}

/** Rejects when the position is unavailable or permission is denied. */
export function getCurrentPosition(): Promise<Coordinates> {
  return isNativePlatform() ? readNativePosition() : readWebPosition()
}
