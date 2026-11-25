import type { UserRead } from "@/shared/api/generated/model";

/**
 * The server sets `profile_completed_at` when the user first saves the "complete profile" form.
 * Names alone are not enough: Google sign-up fills them before the user has seen them.
 */
export function isProfileComplete(user: UserRead): boolean {
  return user.profile_completed_at != null;
}
