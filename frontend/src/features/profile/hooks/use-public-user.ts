import { useSuspenseQuery } from "@tanstack/react-query";
import type { UserRead } from "@/shared/api/generated/model";
import { publicUserQueryOptions } from "@/features/profile/api/public-user-query";

/** Loaded by the `/users/$userId` route loader. */
export function usePublicUser(userId: string): UserRead {
  return useSuspenseQuery(publicUserQueryOptions(userId)).data;
}
