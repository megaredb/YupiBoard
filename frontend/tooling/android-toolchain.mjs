// Locates the JDK, Android SDK and adb for the Android scripts (`build-android.mjs`,
// `stop-android.mjs`), so a stray older Java on PATH or a missing ANDROID_HOME does not break them.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const MIN_JAVA_VERSION = 21;
const IS_WINDOWS = process.platform === "win32";

export const APP_ID = "com.yupiboard.app";
export const ANDROID_DIR = path.resolve("android");

export function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function javaMajorVersion(javaHome) {
  const java = path.join(javaHome, "bin", IS_WINDOWS ? "java.exe" : "java");
  if (!existsSync(java)) return null;
  // `java -version` prints to stderr: `version "21.0.10"`, or `"1.8.0_491"` for Java 8.
  const output = spawnSync(java, ["-version"], { encoding: "utf8" }).stderr ?? "";
  const match = output.match(/version "(\d+)(?:\.(\d+))?/);
  if (!match) return null;
  const major = Number(match[1]);
  return major === 1 ? Number(match[2]) : major;
}

function readWindowsRegistry(key, value) {
  if (!IS_WINDOWS) return null;
  try {
    const output = execFileSync("reg", ["query", key, "/v", value], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.match(/REG_SZ\s+(.+)/)?.[1]?.trim() ?? null;
  } catch {
    // No such registry entry.
    return null;
  }
}

function androidStudioJdks() {
  const studios = [
    readWindowsRegistry("HKLM\\SOFTWARE\\Android Studio", "Path"),
    path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Android", "Android Studio"),
    path.join(os.homedir(), "AppData", "Local", "Programs", "Android Studio"),
    "/opt/android-studio",
    path.join(os.homedir(), "android-studio"),
  ].filter(Boolean);
  const jdks = studios.map((studio) => path.join(studio, "jbr"));
  jdks.push("/Applications/Android Studio.app/Contents/jbr/Contents/Home");
  return jdks;
}

/** JAVA_HOME when it is new enough, otherwise the JDK that ships with Android Studio. */
export function findJavaHome() {
  const candidates = [process.env.JAVA_HOME, ...androidStudioJdks()].filter(Boolean);
  return candidates.find((home) => (javaMajorVersion(home) ?? 0) >= MIN_JAVA_VERSION) ?? null;
}

export function requireJavaHome() {
  const javaHome = findJavaHome();
  if (!javaHome) {
    fail(
      `No JDK ${MIN_JAVA_VERSION}+ found. Install Android Studio, or set JAVA_HOME to a JDK ` +
        `${MIN_JAVA_VERSION}+ (for example Android Studio's "jbr" folder).`,
    );
  }
  return javaHome;
}

/** The SDK Gradle uses: ANDROID_HOME, android/local.properties, or the default install path. */
function findAndroidSdk() {
  const localProperties = path.join(ANDROID_DIR, "local.properties");
  const fromProperties = existsSync(localProperties)
    ? readFileSync(localProperties, "utf8")
        .match(/^sdk\.dir=(.+)$/m)?.[1]
        ?.replaceAll("\\\\", "\\")
        .replaceAll("\\:", ":")
    : null;
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    fromProperties,
    path.join(os.homedir(), "AppData", "Local", "Android", "Sdk"),
    path.join(os.homedir(), "Library", "Android", "sdk"),
    path.join(os.homedir(), "Android", "Sdk"),
  ].filter(Boolean);
  return candidates.find((sdk) => existsSync(path.join(sdk, "platform-tools"))) ?? null;
}

export function requireAdb() {
  const sdk = findAndroidSdk();
  if (!sdk) fail("Android SDK not found. Set ANDROID_HOME to your SDK folder.");
  return path.join(sdk, "platform-tools", IS_WINDOWS ? "adb.exe" : "adb");
}

/** `[serial, state]` pairs; state is `device` once authorized, `unauthorized` while the prompt waits. */
function deviceStates(adb) {
  const output = execFileSync(adb, ["devices"], { encoding: "utf8" });
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state);
}

export function connectedDevices(adb) {
  return deviceStates(adb)
    .filter(([, state]) => state === "device")
    .map(([serial]) => serial);
}

const DEVICE_WAIT_MS = 60_000;
/** With nothing plugged in at all, give up sooner than while a prompt is pending. */
const NO_DEVICE_WAIT_MS = 5000;
const DEVICE_POLL_MS = 1000;

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Authorized devices, waiting while a phone still shows the "Allow USB debugging?" prompt. A fresh
 * adb server (after `pnpm cap:stop` or a reconnect) lists the phone as `unauthorized` until then.
 */
export function waitForDevices(adb) {
  execFileSync(adb, ["start-server"], { stdio: "ignore" });
  const startedAt = Date.now();
  let hasPrompted = false;
  while (Date.now() - startedAt < DEVICE_WAIT_MS) {
    const states = deviceStates(adb);
    const ready = states.filter(([, state]) => state === "device").map(([serial]) => serial);
    const pending = states.filter(([, state]) => state !== "device");
    if (ready.length > 0 && pending.length === 0) return ready;
    if (pending.length > 0 && !hasPrompted) {
      process.stdout.write('Waiting for the device: accept "Allow USB debugging" on the phone.\n');
      hasPrompted = true;
    }
    if (states.length === 0 && Date.now() - startedAt > NO_DEVICE_WAIT_MS) break;
    sleep(DEVICE_POLL_MS);
  }
  return connectedDevices(adb);
}

/** Runs a Gradle task in `android/`; returns the exit status. */
export function runGradle(task, javaHome) {
  const gradlew = path.join(ANDROID_DIR, IS_WINDOWS ? "gradlew.bat" : "gradlew");
  const result = spawnSync(`"${gradlew}" ${task}`, {
    cwd: ANDROID_DIR,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, JAVA_HOME: javaHome },
  });
  return result.status ?? 1;
}
