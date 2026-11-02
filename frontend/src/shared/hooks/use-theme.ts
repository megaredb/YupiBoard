import { useSyncExternalStore } from "react"
import { getResolvedTheme, subscribeTheme, type ResolvedTheme } from "@/shared/platform/theme"

export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeTheme, getResolvedTheme)
}
