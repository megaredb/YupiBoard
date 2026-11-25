import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/shared/config/router-context";
import { ensureCurrentUser, getCachedCurrentUser } from "@/features/auth/api/current-user-query";
import { isProfileComplete } from "@/features/auth/lib/is-profile-complete";
import { toSafeRedirect } from "@/features/auth/lib/safe-redirect";
import type { AuthRedirectSearch } from "@/features/auth/schemas/auth-redirect-search.schema";

export async function requireUser({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  const user = await ensureCurrentUser(context.queryClient);
  if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });
}

/** Moderation is admin-only: guests go to sign-in, everybody else without the flag to the catalog. */
export async function requireSuperuser({
  context,
  location,
}: {
  context: RouterContext;
  location: { href: string };
}): Promise<void> {
  const user = await ensureCurrentUser(context.queryClient);
  if (!user) throw redirect({ to: "/login", search: { redirect: location.href } });
  if (!user.is_superuser) throw redirect({ to: "/events" });
}

/**
 * For the root route: a signed-in user with an incomplete profile may only open the pages that
 * allow it (the profile form itself, terms, e-mail links); everything else redirects there.
 */
export function requireCompleteProfile({
  context,
  matches,
}: {
  context: RouterContext;
  matches: readonly { staticData: { allowsIncompleteProfile?: boolean } }[];
}): void {
  const user = getCachedCurrentUser(context.queryClient);
  if (!user || isProfileComplete(user)) return;
  if (matches.some((match) => match.staticData.allowsIncompleteProfile)) return;
  throw redirect({ to: "/profile/complete" });
}

export async function redirectSignedInUser({
  context,
  search,
}: {
  context: RouterContext;
  search: AuthRedirectSearch;
}): Promise<void> {
  const user = await ensureCurrentUser(context.queryClient);
  if (!user) return;
  if (!isProfileComplete(user)) throw redirect({ to: "/profile/complete" });
  const target = toSafeRedirect(search.redirect);
  throw target ? redirect({ href: target }) : redirect({ to: "/events" });
}
