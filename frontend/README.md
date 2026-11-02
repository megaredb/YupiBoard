# YupiBoard frontend

React 19 + TypeScript + Vite single codebase for the web app and the Android app (Capacitor).
Every contributor, human or AI, follows [RULES.md](./RULES.md).

## Setup

Requirements: Node.js 24+, pnpm 12 (the only package manager; `pnpm-lock.yaml` lives at the
repository root because the frontend is part of the pnpm workspace).

```bash
pnpm install
cp .env.example ../.env   # or add the variables below to the existing root .env
pnpm dev
```

Open the app at <https://yupiboard.localhost> (Traefik forwards it to the Vite server on port
5173; start it with `pnpm docker:up` from the repository root). Do not use
`http://localhost:5173` directly: it is a different site from `api.yupiboard.localhost`, so the
browser never sends the `SameSite=Lax` refresh cookie and every reload or new tab logs you out.

## Environment

Vite reads variables from the repository root `.env` (`envDir` in `vite.config.ts`). All of
them are compiled into the public bundle, so never put secrets here. `src/app/env.ts` validates
them at startup and refuses to start when a required one is missing.

| Variable              | Required | Description                                                       |
| --------------------- | -------- | ----------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | yes      | Backend origin, e.g. `https://api.yupiboard.localhost`            |
| `VITE_PUBLIC_WEB_URL` | yes      | Public web origin used for shareable links                        |
| `GOOGLE_CLIENT_ID`    | no       | Google OAuth web client id; without it Google sign-in is disabled |

## Scripts

| Script                | What it does                                                            |
| --------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`            | Vite dev server                                                         |
| `pnpm build`          | Typecheck, then production build into `dist/`                           |
| `pnpm preview`        | Serve the production build                                              |
| `pnpm typecheck`      | Regenerate `src/routeTree.gen.ts`, then `tsc --noEmit`                  |
| `pnpm lint`           | oxlint (every rule is an error)                                         |
| `pnpm lint:fix`       | oxlint with automatic fixes                                             |
| `pnpm format`         | Prettier, write                                                         |
| `pnpm format:check`   | Prettier, check only                                                    |
| `pnpm knip`           | Unused files, exports and dependencies                                  |
| `pnpm depcruise`      | Layer boundaries (`app → routes → features → shared`)                   |
| `pnpm i18n:check`     | Translation keys exist, are used, and match between `en` and `uk`       |
| `pnpm check:platform` | No browser APIs outside `src/shared/platform`                           |
| `pnpm api:generate`   | Regenerate the API client from `openapi/openapi.json` with Orval        |
| `pnpm cap:sync`       | Build and copy the web app into the Android project                     |
| `pnpm cap:android`    | Open the Android project in Android Studio                              |
| `pnpm check`          | Everything above that verifies code; must pass before handing work over |

There are no tests in this project (RULES.md §16).

## Running on Android

1. `pnpm cap:sync` builds the web app and copies it into `android/`.
2. `pnpm cap:android` opens Android Studio; run the app on a device or emulator from there.

Native code (`android/`) and `capacitor.config.ts` are part of the repository; build outputs are
ignored. Platform-specific code lives only in `src/shared/platform/`.

## Regenerating the API client

1. Export the OpenAPI schema from the backend and copy it to `openapi/openapi.json`.
2. Run `pnpm api:generate` as a separate change. The output in `src/shared/api/generated/` is
   read-only and never edited by hand.

## Project structure

```
src/
├── app/        bootstrap, providers, router, query client, env
├── routes/     thin TanStack Router files (_authenticated, _public layouts)
├── features/   auth · events · profile · saved-events · shell · users
└── shared/     api · platform · ui · layout · components · hooks · lib · i18n · config · styles
```
