import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router"

/** Previous history entry, or the catalog when the page was opened directly. */
export function useGoBack(): () => void {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()

  return () => {
    if (canGoBack) router.history.back()
    else void navigate({ to: "/events" })
  }
}
