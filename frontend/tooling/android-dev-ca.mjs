// Copies the developer's mkcert root CA into the Android debug build, which trusts it (see
// android/app/src/debug), so the app can call https://api.yupiboard.localhost on a device.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const TARGET_DIR = path.resolve("android", "app", "src", "debug", "res", "raw");

function mkcertCaRoot() {
  try {
    return execFileSync("mkcert", ["-CAROOT"], { encoding: "utf8" }).trim();
  } catch {
    // Not installed or not on PATH: reported below with the fix.
    return null;
  }
}

const caRoot = mkcertCaRoot();
const rootCa = caRoot ? path.join(caRoot, "rootCA.pem") : null;
if (!rootCa || !existsSync(rootCa)) {
  process.stderr.write(
    "mkcert root CA not found. Install mkcert and run `pnpm run setup:certs` in the repository root.\n",
  );
  process.exit(1);
}

mkdirSync(TARGET_DIR, { recursive: true });
copyFileSync(rootCa, path.join(TARGET_DIR, "dev_ca.pem"));
process.stdout.write("Android debug build trusts the local mkcert CA.\n");
