# YupiBoard Monorepo

Production-ready monorepo for the **YupiBoard** project, featuring a three-tier backend architecture, modern React SPA client, Capacitor mobile runtime, and Traefik v3 reverse proxy with local SSL.

---

## 🛠 Tech Stack

### 🌐 Networking & Infrastructure

- **Traefik v3**: Automatic reverse proxy, subdomain routing, and local SSL support via `mkcert`.
  - Web Application: `https://yupiboard.localhost`
  - Backend API: `https://api.yupiboard.localhost`
  - Webmail UI (Mailpit): `https://mail.yupiboard.localhost`
  - Database Web GUI (pgweb): `https://db.yupiboard.localhost`
  - Traefik Dashboard: `https://traefik.yupiboard.localhost/dashboard/`
- **Docker Compose**: Services for PostgreSQL 18, Redis, Traefik v3, Mailpit, and pgweb.
- **Redis + Taskiq**: message broker for background and scheduled backend tasks.
- **PostgreSQL 18**: Relational DBMS with connection pooling via `asyncpg`.
- **Mailpit**: Local SMTP server (`1025`) with a fast web client for testing emails (`8025`).
- **pgweb**: Lightweight in-browser PostgreSQL web client (written in Go, consumes ~20 MB RAM).

### 🐍 Backend (`backend/`)

- **Python 3.14 + FastAPI**
- **Package Manager**: `uv`
- **ORM & Database**: Pure **SQLAlchemy 2 (asyncio)** + **asyncpg** (no SQLModel).
- **Migrations**: **Alembic** (async template).
- **Security & Auth**:
  - Password hashing: Argon2id via `pwdlib[argon2]`.
  - Tokens: `pyjwt[crypto]` with RFC 7519 `jti` identifiers and refresh token rotation in the database.
  - Hybrid sessions: HttpOnly SameSite Cookies for web browsers + Bearer/JSON for mobile clients.
  - Google OAuth: Token verification via `google-auth`.
  - Transactional email: `fastapi-mail` with safe fallback for local development.
- **Architecture**: Vertical Slice (Modular) Architecture:
  ```
  core/ (infrastructure, base models, base repos, mail, security)
  modules/ (auth, users, health — each containing models, schemas, repository, service, router, dependencies)
  ```
- **Code Quality**: `ruff` (linter and formatter) + `ty` (static type checker) + `pytest` (async tests).

### ⚛️ Frontend (`frontend/`)

- **React 19 + TypeScript + Vite 8** (pure SPA, no SSR).
- **Routing**: **TanStack Router** (file-based routing, 100% type-safe routes).
- **State Management**:
  - Server state: **TanStack Query v5**.
  - Client state: **Zustand** (with cross-platform storage support).
- **Forms & Validation**: **React Hook Form** + **Zod**.
- **Styling**: **Tailwind CSS v4** + **shadcn/ui** design system (Glassmorphism, Dark Mode) + **Lucide Icons**.
- **API Integration**: **Orval** (code generation of React Query hooks and TypeScript models from FastAPI `/openapi.json`).
- **i18n**: **i18next** (`en`, `uk`).
- **Code Quality**: **oxlint** (type-aware linter via oxlint-tsgolint), **Prettier** (formatter, semicolons), **knip** (dead code), **dependency-cruiser** (layer boundaries), plus i18n and platform checks. Configs live in `frontend/tooling/`; rules are in [`frontend/RULES.md`](frontend/RULES.md).

### 📱 Android App (`frontend/android/`)

- **Capacitor 8**: the frontend bundle runs in an Android WebView; `frontend/capacitor.config.ts` and the native project live in `frontend/`.
- **Plugins**: `app` (back button, App Links), `preferences` (token storage), `geolocation`, `keyboard`, `share`, `status-bar`.
- **Build requirements**: Android Studio or the Android SDK (`ANDROID_HOME`), and JDK 21+ (`pnpm fe cap:build` uses Android Studio's bundled JDK when `JAVA_HOME` is unset or older).

---

## 🚀 Quick Start

### 1. Initial Setup and SSL Certificates

Ensure you have `mkcert`, `docker` (Docker Desktop running), `uv`, Node.js 24+, and `pnpm` installed:

```bash
# Generate local SSL certificates and install dependencies
pnpm run setup
```

Copy the environment variables template (if not already created). Both the backend and Vite read this one root `.env`:

```bash
cp .env.example .env
```

### 2. Start Infrastructure (Docker)

```bash
pnpm docker:up
```

This starts the PostgreSQL, Redis, Traefik, Mailpit, and pgweb containers.

### 3. Run Database Migrations

```bash
pnpm migrate
```

### 4. Generate the API Client

The OpenAPI schema and the generated frontend client are not committed. Generate them after cloning and whenever the backend API changes:

```bash
pnpm generate:api
```

### 5. Start Development Mode

In separate terminals:

```bash
# FastAPI backend (port 8080)
pnpm be dev

# Vite frontend (port 5173)
pnpm fe dev

# Background tasks (notifications); needs Redis from step 2
pnpm be worker
pnpm be scheduler
```

On Windows, if `pnpm be dev` fails with `UnicodeEncodeError` (the FastAPI CLI prints emoji), set `PYTHONIOENCODING=utf-8` in your shell or use Windows Terminal.

The application is now accessible via secure local endpoints:

- **Web**: [https://yupiboard.localhost](https://yupiboard.localhost)
- **API Swagger**: [https://api.yupiboard.localhost/docs](https://api.yupiboard.localhost/docs)
- **Traefik Dashboard**: [https://traefik.yupiboard.localhost/dashboard/](https://traefik.yupiboard.localhost/dashboard/)

---

## 📜 Key Commands (pnpm / package.json)

Run everything from the repository root. Two shortcuts forward to the right part:

- `pnpm fe <script>` runs a script of [`frontend/package.json`](frontend/package.json).
- `pnpm be <script>` runs a script of [`backend/package.json`](backend/package.json).

Plain `pnpm fe` or `pnpm be` lists the available scripts.

### Project commands

| Command                | Description                                                            |
| ---------------------- | ---------------------------------------------------------------------- |
| `pnpm run setup`       | Generate SSL certificates, install pnpm dependencies, and `uv sync`    |
| `pnpm run setup:certs` | Generate SSL certificates only                                         |
| `pnpm docker:up`       | Start PostgreSQL, Redis, Traefik, Mailpit, and pgweb in the background |
| `pnpm docker:down`     | Stop Docker containers                                                 |
| `pnpm docker:down:v`   | Stop Docker containers and remove persistent volumes                   |
| `pnpm redis:logs`      | Follow the Redis container logs                                        |
| `pnpm migrate`         | Apply Alembic migrations                                               |
| `pnpm generate:api`    | Export `openapi.json` from FastAPI and regenerate the frontend client  |
| `pnpm lint`            | Lint frontend and backend                                              |
| `pnpm format`          | Format frontend and backend                                            |
| `pnpm test`            | Run backend tests (`pytest`)                                           |

### Backend commands

| Command             | Description                                          |
| ------------------- | ---------------------------------------------------- |
| `pnpm be dev`       | Start FastAPI server via `uv run fastapi dev`        |
| `pnpm be sync`      | `uv sync`                                            |
| `pnpm be migrate`   | Apply Alembic migrations                             |
| `pnpm be lint`      | `ruff check` and `ty check`                          |
| `pnpm be format`    | `ruff format`                                        |
| `pnpm be test`      | Run tests (`pytest`)                                 |
| `pnpm be worker`    | Start the Taskiq worker for background tasks         |
| `pnpm be scheduler` | Start the Taskiq scheduler for periodic tasks        |
| `pnpm be openapi`   | Export the schema to `frontend/openapi/openapi.json` |

### Frontend commands

The most used ones; every script is listed in [`frontend/README.md`](frontend/README.md#scripts).

| Command               | Description                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `pnpm fe dev`         | Start Vite dev server (port 5173)                                                        |
| `pnpm fe build`       | Typecheck and build the frontend into `frontend/dist`                                    |
| `pnpm fe check`       | All frontend checks: types, lint, formatting, dead code, layers, i18n                    |
| `pnpm fe fix`         | Apply lint auto-fixes and Prettier formatting                                            |
| `pnpm fe cap:sync`    | Build the web app and copy it into the Android project                                   |
| `pnpm fe cap:android` | Open the Android project in Android Studio                                               |
| `pnpm fe cap:build`   | Sync, then build a debug APK (`frontend/android/app/build/outputs/apk/debug`)            |
| `pnpm fe cap:run`     | Sync, install and start the app on a USB phone or emulator, with the local API reachable |

Android build requirements are listed under [Android App](#-android-app-frontendandroid).

---

## 🔒 Authentication & Security

- **Sign Up / Sign In**: Issues a short-lived `access_token` (JWT) and a long-lived `refresh_token`.
- **Web**: The server automatically sets `refresh_token` in the `Set-Cookie` header with `HttpOnly; SameSite=Lax; Path=/api/v1/auth` flags, ensuring full protection against XSS attacks.
- **Mobile**: The `refresh_token` is also returned in the JSON response body, allowing Capacitor to store it in native secure storage using `@capacitor/preferences`.
- **Token Rotation**: Every request to `/api/v1/auth/refresh` invalidates the old token in the database and generates a new token pair with a unique `jti`.
