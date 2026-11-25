# YupiBoard frontend

React 19 + TypeScript + Vite, one codebase for the web app and the Android app (Capacitor).
Every contributor, human or AI, follows [RULES.md](./RULES.md).

## Setup

Requirements: Node.js 24+ and pnpm 12. pnpm is the only package manager; the lockfile lives at
the repository root because the frontend is part of the pnpm workspace.

Follow the [root Quick Start](../README.md#-quick-start) first: it creates the root `.env` (which
already holds the frontend variables below) and starts Docker. Then, from this folder:

```bash
pnpm install
pnpm --dir .. generate:api   # the generated API client is not committed
pnpm dev
```

`.env.example` here lists only the frontend variables; copy them into the root `.env`, never over it.

Open the app at <https://yupiboard.localhost>. Traefik forwards it to the Vite server on port
5173; start it with `pnpm docker:up` from the repository root. Do not use
`http://localhost:5173` directly: it is a different site from `api.yupiboard.localhost`, so the
browser never sends the `SameSite=Lax` refresh cookie and every reload logs you out.

## Environment

Vite reads variables from the repository root `.env` (`envDir` in `vite.config.ts`). All of
them end up in the public bundle, so never put secrets here. `src/app/env.ts` validates them at
startup and refuses to start when a required one is missing.

| Variable                    | Required | Description                                                                                          |
| --------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `VITE_API_BASE_URL`         | yes      | Backend origin, e.g. `https://api.yupiboard.localhost`                                               |
| `VITE_PUBLIC_WEB_URL`       | yes      | Public web origin used for shareable links                                                           |
| `VITE_ANDROID_API_BASE_URL` | no       | Backend origin for the Android app; local device testing uses `https://api.yupiboard.localhost:8443` |

Google sign-in uses the backend's `GOOGLE_CLIENT_ID` (the web client ID): `vite.config.ts` passes
it to the app as `VITE_GOOGLE_CLIENT_ID`, so it is set in one place. Without it Google sign-in
reports that it is unavailable.

`ANDROID_CERT_SHA256` (optional, not a `VITE_` variable, so it never reaches the bundle) lists the
SHA-256 fingerprints of the Android signing certificates, comma-separated. When set, Vite serves
and builds `/.well-known/assetlinks.json` from it (see [App Links](#app-links)).

## Scripts

Run them from `frontend/`, or from the repository root with the `fe` prefix: `pnpm fe check`,
`pnpm fe cap:run`, and so on.

| Script                | What it does                                                              |
| --------------------- | ------------------------------------------------------------------------- |
| `pnpm dev`            | Vite dev server                                                           |
| `pnpm build`          | Typecheck, then production build into `dist/`                             |
| `pnpm preview`        | Serve the production build                                                |
| `pnpm check`          | **Every code check**; must pass before handing work over                  |
| `pnpm fix`            | **Apply lint auto-fixes and Prettier formatting** to the whole code       |
| `pnpm typecheck`      | Regenerate `src/routeTree.gen.ts`, then `tsc --noEmit`                    |
| `pnpm lint`           | Type-aware oxlint (oxlint-tsgolint); every rule is an error               |
| `pnpm lint:fix`       | Type-aware oxlint with automatic fixes                                    |
| `pnpm format`         | Prettier, write                                                           |
| `pnpm format:check`   | Prettier, check only                                                      |
| `pnpm knip`           | Unused files, exports and dependencies                                    |
| `pnpm depcruise`      | Layer boundaries (`app → routes → features → shared`)                     |
| `pnpm i18n:check`     | Translation keys exist, are used, and match between `en` and `uk`         |
| `pnpm check:platform` | No browser APIs outside `src/shared/platform`                             |
| `pnpm generate:api`   | Regenerate the API client from `openapi/openapi.json` with Orval          |
| `pnpm cap:sync`       | Build the web app and copy it into the Android project                    |
| `pnpm cap:android`    | Open the Android project in Android Studio                                |
| `pnpm cap:build`      | `cap:sync`, then build a debug APK with Gradle ([signing](#signing-keys)) |
| `pnpm cap:run`        | `cap:sync`, then install and start the app on connected devices           |
| `pnpm cap:stop`       | Stop the app, port forwarding, adb and Gradle so the phone unplugs        |

`pnpm check` runs `typecheck`, `lint`, `format:check`, `knip`, `depcruise`, `i18n:check` and
`check:platform`. There are no tests in this project (RULES.md §16).

## Code quality tooling

| Tool               | Config                           | Notes                                                                   |
| ------------------ | -------------------------------- | ----------------------------------------------------------------------- |
| Prettier           | `tooling/prettier.json`          | Semicolons, double quotes, width 100, import and Tailwind class sorting |
| Prettier ignore    | `tooling/prettierignore`         | Passed with `--ignore-path`; paths relative to `tooling`                |
| oxlint             | `.oxlintrc.json`                 | Must stay in `frontend/`: oxlint rejects `..` in globs                  |
| knip               | `tooling/knip.json`              |                                                                         |
| dependency-cruiser | `tooling/dependency-cruiser.cjs` | Run through `tooling/depcruise.mjs` (see its header)                    |
| EditorConfig       | `.editorconfig`                  | Must stay in `frontend/` for editors to find it                         |
| Custom checks      | `tooling/*.mjs`                  | i18n, platform ban, route tree, Android build                           |

Generated code (`src/shared/api/generated/`, `src/routeTree.gen.ts`) is excluded from every
lint, format, dead-code and boundary check and from `pnpm fix`; only `tsc` reads it, because
app code imports its types. Regenerate it instead of editing it.

Editors pick everything up without extra settings: `package.json` points Prettier to
`tooling/prettier.json`, and oxlint finds `.oxlintrc.json` on its own.

## Running on Android

Requirements: Android Studio (or the Android SDK with `ANDROID_HOME` set) and JDK 21+. `pnpm cap:build`
uses `JAVA_HOME` when it points to JDK 21+, otherwise the JDK bundled with Android Studio (its `jbr`
folder), so an older Java on `PATH` does not matter. Without Android Studio, set `JAVA_HOME`.

1. `pnpm cap:sync` builds the web app and copies it into `android/`. Run it after every web
   change and after installing or updating a Capacitor plugin (it also rewrites
   `android/capacitor.settings.gradle`).
2. `pnpm cap:android` opens Android Studio; run the app on a device or emulator from there.
3. Or `pnpm cap:build` to get `android/app/build/outputs/apk/debug/app-debug.apk` without the IDE.

### Testing on a phone against the local backend

1. Start the stack (`pnpm docker:up`, `pnpm be dev` in the repository root) and set
   `VITE_ANDROID_API_BASE_URL=https://api.yupiboard.localhost:8443` in the root `.env`.
2. On the phone, turn on Developer options → USB debugging and connect it with USB (wireless
   debugging works too). An emulator works the same way.
3. Run `pnpm cap:run`. It builds, installs and starts the app on every connected device, and
   forwards the device's port 8443 to Traefik's 443 on this computer (Android does not allow
   forwarding ports below 1024). Run it again after reconnecting the phone.
4. Run `pnpm cap:stop` before unplugging. It stops the app, removes the port forwarding and shuts
   down the adb server and Gradle daemons; the adb server is what keeps Windows reporting the phone
   as in use. Close Android Studio first if it is open, or it starts adb again.

Debug builds trust your local mkcert certificate: `pnpm cap:sync` copies its root CA into
`android/app/src/debug/res/raw/` (git-ignored), and only the debug network security config
uses it. Release builds are unaffected. Inspect the app's WebView from `chrome://inspect`.

Known gap: media URLs (avatars, event covers) come from the backend as absolute
`https://api.yupiboard.localhost/media/…` links without the port, so images do not load on a
device until the backend builds them from the request's host.

### Signing keys

Every APK is signed. Google sign-in and App Links both identify the app by its package name
(`com.yupiboard.app`) **plus** the fingerprint of the certificate it was signed with, so every key
you install from must be registered in both places.

- **Debug key**: `android/app/debug.keystore` is committed and every debug build (`pnpm cap:build`,
  `cap:run`, Android Studio) is signed with it, so the whole team shares one fingerprint:
  SHA-1 `7C:A6:2A:C5:F2:4D:F1:2C:E9:DE:EA:54:4F:70:EC:AF:E5:55:6B:5C`, SHA-256
  `2B:C4:E0:2A:C9:32:F6:7A:C6:FC:54:E1:73:CB:C4:33:C6:20:4F:3A:91:A6:A8:9B:DF:E9:5B:43:EA:57:6F:91`.
  It is a debug-only key with the standard `android` passwords: never sign a release with it. A
  phone that has a build signed with another key needs `adb uninstall com.yupiboard.app` once.
- **Release (upload) key**: create it once and keep it safe; losing it means you cannot update the
  app. Never commit it (`*.jks`, `*.keystore` other than the debug key, and `keystore.properties`
  are git-ignored).

  ```sh
  keytool -genkeypair -v -keystore android/yupiboard-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
  ```

  Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in the
  passwords (or set `ANDROID_KEYSTORE_FILE`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`,
  `ANDROID_KEY_PASSWORD`). Then `pnpm cap:sync && node tooling/build-android.mjs --release`
  builds a signed `android/app/build/outputs/apk/release/app-release.apk`. Without the
  properties the release APK is unsigned and cannot be installed.

- **Play App Signing**: if the app is published on Google Play, Google re-signs it with its own
  app signing key. Register that key's fingerprints too (Play Console → Test and release → App
  integrity → App signing).

Print the SHA-1 and SHA-256 of the debug and (when configured) release certificates with:

```sh
node tooling/build-android.mjs --signing-report
```

`keytool -list -v -keystore <file> -alias <alias>` prints the same for any keystore (the debug
keystore's alias is `androiddebugkey`, password `android`).

### Google sign-in

The backend verifies Google ID tokens against **one** audience, the web client ID, on web and on
Android. Set it up in one Google Cloud project (Google Auth Platform / APIs & Services →
Credentials):

1. Configure the OAuth consent screen (app name, support e-mail; add testers while it is in
   testing).
2. Create an OAuth client of type **Web application**. Under Authorized JavaScript origins add
   every web origin: `http://localhost:5173` for local testing and the real site. Google only
   accepts `localhost` itself or hosts under a public top-level domain, so
   `https://yupiboard.localhost` is rejected; test Google sign-in on the web through
   `http://localhost:5173`. Put its client ID in the root `.env` as `GOOGLE_CLIENT_ID`; the backend and the
   frontend both read it. No client secret is needed.
3. Create an OAuth client of type **Android** for package `com.yupiboard.app` with the **SHA-1**
   of a signing certificate, one Android client per certificate (debug keys, release key, Play
   app signing key). Its client ID is never put in the app: Google matches the installed app to
   it by package name and SHA-1, and the app asks for a token for the web client.
4. Rebuild: `pnpm cap:sync` (or `pnpm cap:run`) after changing `GOOGLE_CLIENT_ID`.

On the web the page shows the button Google renders (One Tap is not used; browsers without
third-party cookies never show it). On Android the button opens the system account picker.
"Google sign-in is not available" on Android almost always means the SHA-1 of the installed
build is not registered, or the phone has no Google account.

### App Links

Links to `/events`, `/events/…`, `/users/…`, `/verify-email` and `/reset-password` open in the app
through Android App Links, so the links in verification and password-reset e-mails land on the
app's own pages. Their host is the host of `VITE_PUBLIC_WEB_URL` in the root `.env` (the same
origin shared links use), read by `android/app/build.gradle` at build time; rebuild after
changing it. The backend builds e-mail links from `FRONTEND_URL`, which must be the same origin.

Android opens them without asking only after it verifies the host: the host must serve
`https://<host>/.well-known/assetlinks.json` listing the SHA-256 of the installed app's
certificate. Put the fingerprints in `ANDROID_CERT_SHA256` in the root `.env`; `pnpm dev` serves
the file and `pnpm build` writes it to `dist/.well-known/`. Deploy it with the site, served as
`application/json` without redirects. Check a deployed host with Google's
[Statement List tester](https://developers.google.com/digital-asset-links/tools/generator), and the
phone's view with `adb shell pm get-app-links com.yupiboard.app`.

`yupiboard.localhost` cannot be verified (Google's verifier cannot reach it). For local testing,
approve the host for the app by hand, then open a link:

```sh
adb shell pm set-app-links-user-selection --user cur --package com.yupiboard.app true yupiboard.localhost
adb shell am start -a android.intent.action.VIEW -d "https://yupiboard.localhost/verify-email?token=test"
```

or on the phone: App info → Open by default → Add link.

Native code (`android/`) and `capacitor.config.ts` are part of the repository; build outputs are
ignored. Platform-specific code lives only in `src/shared/platform/`.

## Regenerating the API client

From the repository root, `pnpm generate:api` exports the backend's OpenAPI schema to
`openapi/openapi.json` and then runs this package's `pnpm generate:api` (Orval only). Both the
schema and the output in `src/shared/api/generated/` are git-ignored, so run it after cloning and
whenever the backend API changes. The output is read-only and never edited by hand.

## Project structure

```
src/
├── app/        bootstrap, providers, router, query client, env
├── routes/     thin TanStack Router files (_authenticated, _public layouts)
├── features/   auth · events · profile · shell · users
└── shared/     api · platform · ui · layout · components · hooks · lib · i18n · config · styles
tooling/        formatter, knip and dependency-cruiser configs, check and build scripts
android/        Capacitor Android project
openapi/        OpenAPI schema the API client is generated from
```
