import { getAccessToken, getApiBaseUrl, restoreSessionFromRefreshToken } from "@/shared/api/client";

interface SseMessage {
  event: string;
  data: string;
}

interface ConnectSseOptions {
  path: string;
  requireAuth: boolean;
  onEvent: (message: SseMessage) => void;
  signal: AbortSignal;
}

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30_000;
const BLOCK_SEPARATOR_RE = /\r?\n\r?\n/;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function parseSseLine(line: string): [string, string] | null {
  if (!line || line.startsWith(":")) return null;
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return [line, ""];
  const field = line.slice(0, colonIdx);
  const rawValue = line.slice(colonIdx + 1);
  return [field, rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue];
}

function parseSseChunk(rawBlock: string): SseMessage | null {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of rawBlock.split(/\r?\n/)) {
    const parsed = parseSseLine(line);
    if (!parsed) continue;
    const [field, value] = parsed;
    if (field === "event" && value) eventName = value;
    else if (field === "data") dataLines.push(value);
  }

  return dataLines.length === 0 ? null : { event: eventName, data: dataLines.join("\n") };
}

function drainSseBuffer(buffer: string, onEvent: (message: SseMessage) => void): string {
  let remaining = buffer;
  let match = BLOCK_SEPARATOR_RE.exec(remaining);

  while (match !== null) {
    const block = remaining.slice(0, match.index);
    remaining = remaining.slice(match.index + match[0].length);
    const parsed = parseSseChunk(block);
    if (parsed) onEvent(parsed);
    match = BLOCK_SEPARATOR_RE.exec(remaining);
  }

  return remaining;
}

function buildStreamUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

async function fetchSseResponse(
  path: string,
  requireAuth: boolean,
  signal: AbortSignal,
): Promise<Response | null> {
  const buildHeaders = () => {
    const headers: Record<string, string> = { Accept: "text/event-stream" };
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const url = buildStreamUrl(path);
  let response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "include",
    signal,
  });

  if (response.status === 401 && requireAuth) {
    const refreshed = await restoreSessionFromRefreshToken();
    if (!refreshed) return null;
    response = await fetch(url, {
      method: "GET",
      headers: buildHeaders(),
      credentials: "include",
      signal,
    });
  }

  if (!response.ok || !response.body) {
    throw new Error(`SSE stream failed with status ${response.status}`);
  }
  return response;
}

async function readSseStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (message: SseMessage) => void,
  signal: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = drainSseBuffer(buffer + decoder.decode(value, { stream: true }), onEvent);
  }
}

export async function connectSseStream({
  path,
  requireAuth,
  onEvent,
  signal,
}: ConnectSseOptions): Promise<void> {
  let attempt = 0;

  while (!signal.aborted) {
    try {
      const response = await fetchSseResponse(path, requireAuth, signal);
      if (!response?.body) return;
      attempt = 0;
      await readSseStream(response.body, onEvent, signal);
    } catch {
      if (signal.aborted) return;
    }

    if (signal.aborted) return;
    const delay = Math.min(INITIAL_RETRY_MS * 2 ** attempt, MAX_RETRY_MS);
    attempt += 1;
    await sleep(delay, signal);
  }
}
