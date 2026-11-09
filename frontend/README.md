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
| `VITE_GOOGLE_CLIENT_ID`     | no       | Google OAuth web client id; without it Google sign-in is disabled                                    |

## Scripts

Run them from `frontend/`, or from the repository root with the `fe` prefix: `pnpm fe check`,
`pnpm fe cap:run`, and so on.

| Script                | What it does                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `pnpm dev`            | Vite dev server                                                     |
| `pnpm build`          | Typecheck, then production build into `dist/`                       |
| `pnpm preview`        | Serve the production build                                          |
| `pnpm check`          | **Every code check**; must pass before handing work over            |
| `pnpm fix`            | **Apply lint auto-fixes and Prettier formatting** to the whole code |
| `pnpm typecheck`      | Regenerate `src/routeTree.gen.ts`, then `tsc --noEmit`              |
| `pnpm lint`           | Type-aware oxlint (oxlint-tsgolint); every rule is an error         |
| `pnpm lint:fix`       | Type-aware oxlint with automatic fixes                              |
| `pnpm format`         | Prettier, write                                                     |
| `pnpm format:check`   | Prettier, check only                                                |
| `pnpm knip`           | Unused files, exports and dependencies                              |
| `pnpm depcruise`      | Layer boundaries (`app → routes → features → shared`)               |
| `pnpm i18n:check`     | Translation keys exist, are used, and match between `en` and `uk`   |
| `pnpm check:platform` | No browser APIs outside `src/shared/platform`                       |
| `pnpm generate:api`   | Regenerate the API client from `openapi/openapi.json` with Orval    |
| `pnpm cap:sync`       | Build the web app and copy it into the Android project              |
| `pnpm cap:android`    | Open the Android project in Android Studio                          |
| `pnpm cap:build`      | `cap:sync`, then build a debug APK with Gradle                      |
| `pnpm cap:run`        | `cap:sync`, then install and start the app on connected devices     |

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

Debug builds trust your local mkcert certificate: `pnpm cap:sync` copies its root CA into
`android/app/src/debug/res/raw/` (git-ignored), and only the debug network security config
uses it. Release builds are unaffected. Inspect the app's WebView from `chrome://inspect`.

Known gap: media URLs (avatars, event covers) come from the backend as absolute
`https://api.yupiboard.localhost/media/…` links without the port, so images do not load on a
device until the backend builds them from the request's host.

`/verify-email` and `/reset-password` e-mail links open in the app through Android App Links.
Their host is `appLinkHost` in `android/app/build.gradle`; Android only verifies the links when
that host serves `/.well-known/assetlinks.json` for the app's signing key.

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
├── features/   auth · events · profile · saved-events · shell · users
└── shared/     api · platform · ui · layout · components · hooks · lib · i18n · config · styles
tooling/        formatter, knip and dependency-cruiser configs, check and build scripts
android/        Capacitor Android project
openapi/        OpenAPI schema the API client is generated from
```
