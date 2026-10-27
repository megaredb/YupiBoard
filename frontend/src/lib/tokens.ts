import { Capacitor } from "@capacitor/core"
import { Preferences } from "@capacitor/preferences"

const ACCESS_KEY = "access_token"
const REFRESH_KEY = "refresh_token"

const isNative = Capacitor.isNativePlatform()

// Web: only the access token is persisted. The refresh token lives in an HttpOnly
// cookie set by the API, so it is never readable from JS.
// Native (Capacitor): cookies are unreliable, so both tokens go in Preferences and
// the refresh token is sent as a bearer value in the request body.
const storage = {
  async get(key: string): Promise<string | null> {
    return isNative ? (await Preferences.get({ key })).value : localStorage.getItem(key)
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative) await Preferences.set({ key, value })
    else localStorage.setItem(key, value)
  },
  async remove(key: string): Promise<void> {
    if (isNative) await Preferences.remove({ key })
    else localStorage.removeItem(key)
  },
}

// In-memory copy so the axios interceptors can read tokens synchronously.
let accessToken: string | null = null
let refreshToken: string | null = null

async function load(): Promise<void> {
  if (!isNative) {
    // Older builds stored the refresh token in localStorage on web; drop it.
    localStorage.removeItem(REFRESH_KEY)
  }
  accessToken = await storage.get(ACCESS_KEY)
  refreshToken = isNative ? await storage.get(REFRESH_KEY) : null
}

/** Resolves once persisted tokens are in memory. Requests wait on this. */
export const tokensReady: Promise<void> = load().catch(() => {})

export const getAccessToken = () => accessToken
export const getRefreshToken = () => refreshToken

export async function saveTokens(access: string, refresh?: string | null): Promise<void> {
  accessToken = access
  await storage.set(ACCESS_KEY, access)
  if (isNative && refresh) {
    refreshToken = refresh
    await storage.set(REFRESH_KEY, refresh)
  }
}

export async function clearTokens(): Promise<void> {
  accessToken = null
  refreshToken = null
  await Promise.all([storage.remove(ACCESS_KEY), storage.remove(REFRESH_KEY)])
}
