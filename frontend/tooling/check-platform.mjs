// TOOL-5: browser globals that lint cannot ban by name stay inside shared/platform and app/env.ts.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("src");
const ALLOWED = [path.join(SRC, "shared", "platform") + path.sep, path.join(SRC, "app", "env.ts")];
const SKIPPED = [
  path.join(SRC, "shared", "api", "generated") + path.sep,
  path.join(SRC, "routeTree.gen.ts"),
];
const FORBIDDEN = [/\bwindow\.location\b/, /\bwindow\.open\b/, /\bdocument\.documentElement\b/];

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true, recursive: true });
  return entries
    .filter((entry) => entry.isFile() && /\.(ts|tsx)$/.test(entry.name))
    .map((entry) => path.join(entry.parentPath, entry.name));
}

function isExempt(file) {
  return [...ALLOWED, ...SKIPPED].some((prefix) => file === prefix || file.startsWith(prefix));
}

const violations = [];
for (const file of await listSourceFiles(SRC)) {
  if (isExempt(file)) continue;
  const lines = (await readFile(file, "utf8")).split("\n");
  lines.forEach((line, index) => {
    const match = FORBIDDEN.find((pattern) => pattern.test(line));
    if (match) violations.push(`${path.relative(".", file)}:${index + 1}  ${match.source}`);
  });
}

if (violations.length > 0) {
  process.stderr.write(
    `Platform APIs used outside src/shared/platform:\n${violations.join("\n")}\n`,
  );
  process.exit(1);
}
process.stdout.write("check:platform OK\n");
