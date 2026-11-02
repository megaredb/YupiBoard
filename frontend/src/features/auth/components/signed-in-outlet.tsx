import { Outlet } from "@tanstack/react-router"
import { useCurrentUser } from "@/features/auth/hooks/use-current-user"

/**
 * Component of the `_authenticated` layout. The guard already ran in `beforeLoad`; this only
 * unmounts protected pages the moment the session ends, before the redirect lands.
 */
export function SignedInOutlet() {
  const user = useCurrentUser()
  return user ? <Outlet /> : null
}
