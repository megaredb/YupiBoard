export interface SseMessage {
  event: string;
  data: string;
}

const BLOCK_SEPARATOR_RE = /\r?\n\r?\n/;

function parseSseLine(line: string): [string, string] | null {
  if (!line || line.startsWith(":")) return null;
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return [line, ""];
  const field = line.slice(0, colonIdx);
  const rawValue = line.slice(colonIdx + 1);
  return [field, rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue];
}

function parseSseBlock(rawBlock: string): SseMessage | null {
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

/** Emits every complete message in `buffer` and returns the unfinished tail. */
export function drainSseBuffer(buffer: string, onMessage: (message: SseMessage) => void): string {
  let remaining = buffer;
  let match = BLOCK_SEPARATOR_RE.exec(remaining);

  while (match !== null) {
    const message = parseSseBlock(remaining.slice(0, match.index));
    remaining = remaining.slice(match.index + match[0].length);
    if (message) onMessage(message);
    match = BLOCK_SEPARATOR_RE.exec(remaining);
  }

  return remaining;
}
