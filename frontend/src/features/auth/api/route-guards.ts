import { redirect } from "@tanstack/react-router"
import type { RouterContext } from "@/shared/config/router-context"
import { ensureCurrentUser } from "@/features/auth/api/current-user-query"
import { isProfileComplete } from "@/features/auth/lib/is-profile-complete"
import { toSafeRedirect } from "@/features/auth/lib/safe-redirect"
import type { AuthRedirectSearch } from "@/features/auth/schemas/auth-redirect-search.schema"

/** `beforeLoad` of the `_authenticated` layout: the only auth guard (RT-2). */
export async function requireUser({
  context,
  location,
}: {
  context: RouterContext
  location: { href: string }
}): Promise<void> {
  const user = await ensureCurrentUser(context.queryClient)
  if (!user) throw redirect({ to: "/login", search: { redirect: location.href } })
}

/** `beforeLoad` of the `_public` layout: signed-in users skip `/login` and `/register`. */
export async function redirectSignedInUser({
  context,
  search,
}: {
  context: RouterContext
  search: AuthRedirectSearch
}): Promise<void> {
  const user = await ensureCurrentUser(context.queryClient)
  if (!user) return
  if (!isProfileComplete(user)) throw redirect({ to: "/profile/complete" })
  const target = toSafeRedirect(search.redirect)
  throw target ? redirect({ href: target }) : redirect({ to: "/events" })
}
