import type { UserRead } from "@/shared/api/generated/model"
import { useCurrentUser } from "@/features/auth/hooks/use-current-user"

/** For pages under `_authenticated`, whose outlet only renders while a user is signed in. */
export function useSignedInUser(): UserRead {
  const user = useCurrentUser()
  if (!user) throw new Error("useSignedInUser() used outside the _authenticated layout")
  return user
}
