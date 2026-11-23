// Undoes `pnpm cap:run` so the phone can be unplugged: stops the app, removes the port forwarding,
// shuts down the adb server (it keeps the USB connection open, which is why Windows reports the
// phone as "in use") and stops the Gradle daemons the build left running.
// Every step is best effort: a device that is already gone must not stop the rest.
import { execFileSync } from "node:child_process";
import {
  APP_ID,
  connectedDevices,
  findJavaHome,
  requireAdb,
  runGradle,
} from "./android-toolchain.mjs";

function tryRun(adb, args) {
  try {
    execFileSync(adb, args, { stdio: ["ignore", "ignore", "inherit"] });
    return true;
  } catch {
    // Reported by adb on stderr; the next steps still release what they can.
    return false;
  }
}

function listDevices(adb) {
  try {
    return connectedDevices(adb);
  } catch {
    // adb server not running: nothing is attached, so there is nothing to undo per device.
    return [];
  }
}

const adb = requireAdb();
for (const serial of listDevices(adb)) {
  tryRun(adb, ["-s", serial, "shell", "am", "force-stop", APP_ID]);
  tryRun(adb, ["-s", serial, "reverse", "--remove-all"]);
  process.stdout.write(`Stopped the app and removed port forwarding on ${serial}.\n`);
}

if (tryRun(adb, ["kill-server"])) process.stdout.write("adb server stopped.\n");

const javaHome = findJavaHome();
if (javaHome && runGradle("--stop", javaHome) === 0) {
  process.stdout.write("Gradle daemons stopped.\n");
}

process.stdout.write(
  "The device can be unplugged now. If Android Studio is open, it may restart adb: close it first.\n",
);
