// TOOL-4 layer check. dependency-cruiser cannot read TypeScript 7 sources yet (it needs the
// TS <= 6 compiler API), so src/ is first transpiled with Vite's Oxc transform into a cache
// folder and the rules in dependency-cruiser.cjs run on that copy. Type-only imports are erased
// by the transform, so only runtime imports are checked.
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { transformWithOxc } from "vite";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "node_modules", ".cache", "depcruise");

async function transpile(file) {
  const relative = path.relative(ROOT, file);
  await mkdir(path.dirname(path.join(OUT, relative)), { recursive: true });
  if (!/\.tsx?$/.test(file)) {
    await copyFile(file, path.join(OUT, relative));
    return;
  }
  const lang = file.endsWith(".tsx") ? "tsx" : "ts";
  const { code } = await transformWithOxc(await readFile(file, "utf8"), file, { lang });
  await writeFile(path.join(OUT, relative.replace(/\.tsx?$/, ".js")), code);
}

await rm(OUT, { recursive: true, force: true });
const entries = await readdir(SRC, { withFileTypes: true, recursive: true });
const files = entries
  .filter((entry) => entry.isFile() && /\.(tsx?|json)$/.test(entry.name))
  .map((entry) => path.join(entry.parentPath, entry.name));
await Promise.all(files.map(transpile));
await writeFile(
  path.join(OUT, "alias.config.cjs"),
  `module.exports = { resolve: { alias: { "@": ${JSON.stringify(path.join(OUT, "src"))} } } };
`,
);

const result = spawnSync(
  "pnpm",
  ["exec", "depcruise", "src", "--config", path.join(ROOT, "tooling", "dependency-cruiser.cjs")],
  { cwd: OUT, stdio: "inherit", shell: true },
);
process.exit(result.status ?? 1);
