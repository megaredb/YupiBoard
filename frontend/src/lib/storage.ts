import { Capacitor } from "@capacitor/core"
import { Preferences } from "@capacitor/preferences"

export const appStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key })
      return value
    }
    return typeof window !== "undefined" ? localStorage.getItem(key) : null
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value })
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value)
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key })
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(key)
    }
  },
}
