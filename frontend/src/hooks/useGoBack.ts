import { useCallback } from "react"
import { useNavigate, useRouter, type LinkProps } from "@tanstack/react-router"

/** Browser-back when there is history, otherwise go to `fallback` (e.g. page opened from a shared link). */
export function useGoBack(fallback: NonNullable<LinkProps["to"]> = "/") {
  const router = useRouter()
  const navigate = useNavigate()

  return useCallback(() => {
    if (router.history.canGoBack()) router.history.back()
    else void navigate({ to: fallback })
  }, [router, navigate, fallback])
}
