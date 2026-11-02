// TOOL-6: every literal key exists, no key is unused, and every locale has the same keys and
// interpolation variables. Plural suffixes (`_one`, `_few`, …) are folded into their base key.
import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

const SRC = path.resolve("src")
const LOCALES_DIR = path.join(SRC, "shared", "i18n", "locales")
const REFERENCE_LOCALE = "en"
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/
const SKIPPED = [path.join(SRC, "shared", "api", "generated"), path.join(SRC, "routeTree.gen.ts")]

function flatten(object, prefix, into) {
  for (const [key, value] of Object.entries(object)) {
    const fullKey = `${prefix}.${key}`
    if (typeof value === "string") into.set(fullKey, value)
    else flatten(value, fullKey, into)
  }
  return into
}

async function loadLocale(locale) {
  const directory = path.join(LOCALES_DIR, locale)
  const strings = new Map()
  for (const file of await readdir(directory)) {
    const namespace = path.basename(file, ".json")
    flatten(JSON.parse(await readFile(path.join(directory, file), "utf8")), namespace, strings)
  }
  return strings
}

function variablesOf(text) {
  return [...text.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map((match) => match[1])
    .sort()
    .join(",")
}

/** Base key -> sorted interpolation variables of all its plural forms. */
function summarize(strings) {
  const summary = new Map()
  for (const [key, text] of strings) {
    const base = key.replace(PLURAL_SUFFIX, "")
    const variables = new Set([...(summary.get(base) ?? []), ...variablesOf(text).split(",")])
    summary.set(base, variables)
  }
  return new Map(
    [...summary].map(([key, vars]) => [key, [...vars].filter(Boolean).sort().join(",")]),
  )
}

async function collectUsedKeys(namespaces) {
  const pattern = new RegExp(`["'\`]((?:${namespaces.join("|")})\\.[A-Za-z0-9_.]+)["'\`]`, "g")
  const entries = await readdir(SRC, { withFileTypes: true, recursive: true })
  const used = new Map()
  for (const entry of entries) {
    const file = path.join(entry.parentPath, entry.name)
    if (!entry.isFile() || !/\.(ts|tsx)$/.test(entry.name)) continue
    if (SKIPPED.some((skipped) => file.startsWith(skipped))) continue
    for (const match of (await readFile(file, "utf8")).matchAll(pattern)) {
      used.set(match[1], path.relative(".", file))
    }
  }
  return used
}

const locales = await readdir(LOCALES_DIR)
const summaries = new Map()
for (const locale of locales) summaries.set(locale, summarize(await loadLocale(locale)))
const reference = summaries.get(REFERENCE_LOCALE)
const namespaces = (await readdir(path.join(LOCALES_DIR, REFERENCE_LOCALE))).map((file) =>
  path.basename(file, ".json"),
)
const problems = []

for (const [locale, summary] of summaries) {
  if (locale === REFERENCE_LOCALE) continue
  for (const [key, vars] of reference) {
    if (!summary.has(key)) problems.push(`[${locale}] missing key ${key}`)
    else if (summary.get(key) !== vars) problems.push(`[${locale}] variables differ for ${key}`)
  }
  for (const key of summary.keys()) {
    if (!reference.has(key)) problems.push(`[${locale}] extra key ${key}`)
  }
}

const used = await collectUsedKeys(namespaces)
for (const [key, file] of used) {
  if (!reference.has(key)) problems.push(`unknown key ${key} (${file})`)
}
for (const key of reference.keys()) {
  if (!used.has(key)) problems.push(`unused key ${key}`)
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`)
  process.exit(1)
}
process.stdout.write(`i18n:check OK (${reference.size} keys, locales: ${locales.join(", ")})\n`)
