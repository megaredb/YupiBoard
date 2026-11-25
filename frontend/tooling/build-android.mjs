// Builds the debug APK from the synced Android project. With `--run` it also installs the app on
// every connected phone or emulator, forwards the device port of VITE_ANDROID_API_BASE_URL to the
// local Traefik on port 443 (Android does not let adb bind ports below 1024) and starts the app.
// `pnpm cap:stop` undoes the forwarding and releases the devices.
// With `--release` it builds the release APK, signed when android/keystore.properties is set up.
// With `--signing-report` it prints the SHA-1/SHA-256 of the debug and release certificates.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  ANDROID_DIR,
  APP_ID,
  fail,
  requireAdb,
  requireJavaHome,
  runGradle,
  waitForDevices,
} from "./android-toolchain.mjs";

const TRAEFIK_PORT = "tcp:443";
const ROOT_ENV_FILE = path.resolve("..", ".env");
const shouldRun = process.argv.includes("--run");
const isRelease = process.argv.includes("--release");
const isSigningReport = process.argv.includes("--signing-report");

/** Port of VITE_ANDROID_API_BASE_URL in the root `.env`, the one the app calls on the device. */
function androidApiPort() {
  const env = existsSync(ROOT_ENV_FILE) ? readFileSync(ROOT_ENV_FILE, "utf8") : "";
  const url = env.match(/^VITE_ANDROID_API_BASE_URL=(.+)$/m)?.[1]?.trim();
  const port = url ? new URL(url).port : "";
  if (!port) {
    fail(
      "Set VITE_ANDROID_API_BASE_URL with a port in the root .env, e.g. " +
        "https://api.yupiboard.localhost:8443 (see frontend/.env.example), then run again.",
    );
  }
  return port;
}

function gradle(task, javaHome) {
  const status = runGradle(task, javaHome);
  if (status !== 0) process.exit(status);
}

function installAndLaunch(javaHome) {
  const devicePort = `tcp:${androidApiPort()}`;
  const adb = requireAdb();
  const devices = waitForDevices(adb);
  if (devices.length === 0) {
    fail(
      "No authorized device found. Connect a phone with USB debugging on and accept the " +
        '"Allow USB debugging" prompt, or start an emulator.',
    );
  }
  gradle("installDebug", javaHome);
  for (const serial of devices) {
    execFileSync(adb, ["-s", serial, "reverse", devicePort, TRAEFIK_PORT], { stdio: "inherit" });
    execFileSync(adb, ["-s", serial, "shell", "am", "start", "-n", `${APP_ID}/.MainActivity`], {
      stdio: "inherit",
    });
    process.stdout.write(
      `Started on ${serial}; its ${devicePort} reaches Traefik on this computer.\n`,
    );
  }
  process.stdout.write("Run `pnpm cap:stop` before unplugging the device.\n");
}

const javaHome = requireJavaHome();
process.stdout.write(`Using JDK: ${javaHome}\n`);

if (isSigningReport) {
  gradle(":app:signingReport", javaHome);
} else if (shouldRun) {
  installAndLaunch(javaHome);
} else if (isRelease) {
  gradle("assembleRelease", javaHome);
  const dir = path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "release");
  process.stdout.write(`APK folder: ${path.relative(".", dir)}\n`);
} else {
  gradle("assembleDebug", javaHome);
  const apk = path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  process.stdout.write(`APK: ${path.relative(".", apk)}\n`);
}
