import type { EventRead } from "@/shared/api/generated/model";

/**
 * The backend keeps a started event `Published` until it ends, but closes booking, cancelling,
 * booking decisions and event cancellation at the start time.
 */
export function hasEventStarted(
  { start_datetime }: Pick<EventRead, "start_datetime">,
  now: number = Date.now(),
): boolean {
  return now >= Date.parse(start_datetime);
}
