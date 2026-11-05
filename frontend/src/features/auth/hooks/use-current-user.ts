import { useQuery } from "@tanstack/react-query";
import type { UserRead } from "@/shared/api/generated/model";
import { currentUserQueryOptions } from "@/features/auth/api/current-user-query";

export function useCurrentUser(): UserRead | null {
  const { data } = useQuery(currentUserQueryOptions());
  return data ?? null;
}
