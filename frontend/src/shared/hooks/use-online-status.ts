import { useSyncExternalStore } from "react";
import { isOnline, subscribeOnlineStatus } from "@/shared/platform/online-status";

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribeOnlineStatus, isOnline);
}
