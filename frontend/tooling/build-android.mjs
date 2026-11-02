// Builds a debug APK from the synced Android project. Gradle needs JDK 21 (JAVA_HOME) and the
// Android SDK (ANDROID_HOME or android/local.properties).
import { spawnSync } from "node:child_process";
import path from "node:path";

const ANDROID_DIR = path.resolve("android");
const gradlew = path.join(ANDROID_DIR, process.platform === "win32" ? "gradlew.bat" : "gradlew");

const result = spawnSync(`"${gradlew}"`, ["assembleDebug"], {
  cwd: ANDROID_DIR,
  stdio: "inherit",
  shell: true,
});
if (result.status === 0) {
  const apk = path.join(ANDROID_DIR, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  process.stdout.write(`APK: ${path.relative(".", apk)}\n`);
}
process.exit(result.status ?? 1);
