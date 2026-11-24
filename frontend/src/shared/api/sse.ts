import type { AxiosRequestConfig } from "axios";
import { toApiError } from "@/shared/api/errors";
import { drainSseBuffer, type SseMessage } from "@/shared/api/sse-parser";

interface ConnectSseOptions {
  /** Opens the stream through a generated endpoint called with `SSE_REQUEST_OPTIONS`. */
  open: (signal: AbortSignal) => Promise<unknown>;
  signal: AbortSignal;
  onMessage: (message: SseMessage) => void;
  /** Runs when a dropped stream is back, so the caller can refetch what it missed meanwhile. */
  onReconnect: () => void;
}

/**
 * Streams through the shared axios instance, so auth, token refresh and `ApiError` apply.
 * The default request timeout would cut a long-lived stream; staleness is watched instead.
 */
export const SSE_REQUEST_OPTIONS: AxiosRequestConfig = {
  adapter: "fetch",
  responseType: "stream",
  timeout: 0,
  headers: { Accept: "text/event-stream" },
};

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;
// The server sends a heartbeat comment every 20 s. Longer silence means the connection died
// without closing, which happens when Android suspends the WebView or the network changes.
const STALE_STREAM_MS = 45_000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

/** One attempt's abort signal: aborted by the caller, by `close()`, or after a silent stretch. */
function createConnection(parent: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  let timer = setTimeout(abort, STALE_STREAM_MS);
  parent.addEventListener("abort", abort, { once: true });

  return {
    signal: controller.signal,
    touch: () => {
      clearTimeout(timer);
      timer = setTimeout(abort, STALE_STREAM_MS);
    },
    close: () => {
      clearTimeout(timer);
      parent.removeEventListener("abort", abort);
      abort();
    },
  };
}

// 4xx other than timeout/rate limit will not heal by retrying: the event is gone or hidden, or the
// session ended (the client has already tried a refresh and reported an expired session).
function isPermanentFailure(error: unknown): boolean {
  const { status } = toApiError(error);
  return status !== null && status >= 400 && status < 500 && status !== 408 && status !== 429;
}

async function readStream(
  body: unknown,
  onMessage: (message: SseMessage) => void,
  onActivity: () => void,
): Promise<void> {
  if (!(body instanceof ReadableStream)) throw new TypeError("Response is not a stream");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    const chunk: ReadableStreamReadResult<Uint8Array> = await reader.read();
    if (chunk.done) return;
    onActivity();
    buffer = drainSseBuffer(buffer + decoder.decode(chunk.value, { stream: true }), onMessage);
  }
}

/** Keeps a Server-Sent Events stream open until `signal` aborts, reconnecting with backoff. */
export async function connectSseStream({
  open,
  signal,
  onMessage,
  onReconnect,
}: ConnectSseOptions): Promise<void> {
  let failures = 0;
  let hasConnected = false;

  while (!signal.aborted) {
    const connection = createConnection(signal);
    try {
      const body = await open(connection.signal);
      if (hasConnected) onReconnect();
      hasConnected = true;
      failures = 0;
      await readStream(body, onMessage, connection.touch);
    } catch (error) {
      if (signal.aborted || isPermanentFailure(error)) return;
      failures += 1;
    } finally {
      connection.close();
    }
    await sleep(Math.min(INITIAL_RETRY_MS * 2 ** failures, MAX_RETRY_MS), signal);
  }
}
