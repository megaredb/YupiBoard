import { Capacitor } from "@capacitor/core"

/** True inside the Android (Capacitor) shell, false in a browser. */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}
