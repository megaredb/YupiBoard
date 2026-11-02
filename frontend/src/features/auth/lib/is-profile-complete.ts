import type { UserRead } from "@/shared/api/generated/model"

export function isProfileComplete(user: UserRead): boolean {
  return Boolean(user.first_name?.trim() && user.last_name?.trim())
}
