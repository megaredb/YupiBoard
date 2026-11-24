import { z } from "zod";

const streamedNotificationSchema = z.object({
  metadata_payload: z.object({ event_id: z.string().min(1).optional() }).nullish(),
});

/** The event a streamed `notification.created` payload refers to, if any. */
export function readStreamedEventId(rawData: string): string | null {
  let payload: unknown;
  try {
    payload = JSON.parse(rawData);
  } catch {
    // A malformed frame only skips the event refresh; the notification lists still refetch.
    return null;
  }
  const parsed = streamedNotificationSchema.safeParse(payload);
  return parsed.success ? (parsed.data.metadata_payload?.event_id ?? null) : null;
}
