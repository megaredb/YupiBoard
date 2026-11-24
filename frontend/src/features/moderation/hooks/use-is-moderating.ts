import type { EventRead } from "@/shared/api/generated/model";
import { useCurrentUser } from "@/features/auth";

/** True while an administrator looks at an event that still awaits their decision. */
export function useIsModerating(event: Pick<EventRead, "status">): boolean {
  const user = useCurrentUser();
  return Boolean(user?.is_superuser) && event.status === "OnModeration";
}
