import { redirect } from "@tanstack/react-router"
import { getAccessToken, tokensReady } from "@/lib/tokens"

/** Route `beforeLoad`: send unauthenticated visitors to `/login`. */
export async function requireAuth() {
  await tokensReady
  if (!getAccessToken()) {
    throw redirect({ to: "/login" })
  }
}

