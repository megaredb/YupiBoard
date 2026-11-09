// Builds the debug APK from the synced Android project. With `--run` it also installs the app on
// every connected phone or emulator, forwards the device port of VITE_ANDROID_API_BASE_URL to the
// local Traefik on port 443 (Android does not let adb bind ports below 1024) and starts the app.
//
// Gradle needs the Android SDK and JDK 21+: JAVA_HOME when it is new enough, otherwise the JDK
// that ships with Android Studio, so a stray older Java on PATH does not break the build.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const MIN_JAVA_VERSION = 21;
const APP_ID = "com.yupiboard.app";
const TRAEFIK_PORT = "tcp:443";
const ROOT_ENV_FILE = path.resolve("..", ".env");
const ANDROID_DIR = path.resolve("android");
const IS_WINDOWS = process.platform === "win32";
const shouldRun = process.argv.includes("--run");

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

function findJavaHome() {
  const candidates = [process.env.JAVA_HOME, ...androidStudioJdks()].filter(Boolean);
  return candidates.find((home) => (javaMajorVersion(home) ?? 0) >= MIN_JAVA_VERSION) ?? null;
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

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function runGradle(task, javaHome) {
  const gradlew = path.join(ANDROID_DIR, IS_WINDOWS ? "gradlew.bat" : "gradlew");
  const result = spawnSync(`"${gradlew}" ${task}`, {
    cwd: ANDROID_DIR,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, JAVA_HOME: javaHome },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function connectedDevices(adb) {
  const output = execFileSync(adb, ["devices"], { encoding: "utf8" });
  return output
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([serial, state]) => serial && state === "device")
    .map(([serial]) => serial);
}

function installAndLaunch(javaHome) {
  const devicePort = `tcp:${androidApiPort()}`;
  const sdk = findAndroidSdk();
  if (!sdk) fail("Android SDK not found. Set ANDROID_HOME to your SDK folder.");
  const adb = path.join(sdk, "platform-tools", IS_WINDOWS ? "adb.exe" : "adb");
  const devices = connectedDevices(adb);
  if (devices.length === 0) {
    fail("No device found. Connect a phone with USB debugging on, or start an emulator.");
  }
  runGradle("installDebug", javaHome);
  for (const serial of devices) {
    execFileSync(adb, ["-s", serial, "reverse", devicePort, TRAEFIK_PORT], { stdio: "inherit" });
    execFileSync(adb, ["-s", serial, "shell", "am", "start", "-n", `${APP_ID}/.MainActivity`], {
      stdio: "inherit",
    });
    process.stdout.write(
      `Started on ${serial}; its ${devicePort} reaches Traefik on this computer.\n`,
    );
  }
}

const javaHome = findJavaHome();
if (!javaHome) {
  fail(
    `No JDK ${MIN_JAVA_VERSION}+ found. Install Android Studio, or set JAVA_HOME to a JDK ` +
      `${MIN_JAVA_VERSION}+ (for example Android Studio's "jbr" folder).`,
  );
}
process.stdout.write(`Using JDK: ${javaHome}\n`);

if (shouldRun) {
  installAndLaunch(javaHome);
} else {
  runGradle("assembleDebug", javaHome);
  const apk = path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  process.stdout.write(`APK: ${path.relative(".", apk)}\n`);
}
