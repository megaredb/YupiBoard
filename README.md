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
- **Docker Compose**: Services for PostgreSQL 18, Traefik v3, Mailpit, and pgweb.
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

### 📱 Mobile Runtime (`mobile/`)

- **Capacitor 8**:
  - `@capacitor/core`, `@capacitor/cli`
  - `@capacitor/preferences` (secure token storage on iOS / Android)
  - `@capacitor/browser` (OAuth web authentication)
  - Bundling: consumes the production build from `../frontend/dist`.

---

## 🚀 Quick Start

### 1. Initial Setup and SSL Certificates

Ensure you have `mkcert`, `docker`, `uv`, and `pnpm` installed:

```bash
# Generate local SSL certificates and install dependencies
pnpm run setup
```

Copy the environment variables template (if not already created):

```bash
cp .env.example .env
```

### 2. Start Infrastructure (Docker)

```bash
pnpm docker:up
```

This starts the PostgreSQL, Traefik, Mailpit, and pgweb containers.

### 3. Run Database Migrations

```bash
pnpm migrate
```

### 4. Start Development Mode

In separate terminals:

```bash
# FastAPI backend (port 8080)
pnpm dev:backend

# Vite frontend (port 5173)
pnpm dev:frontend
# or simply:
pnpm dev
```

The application is now accessible via secure local endpoints:

- **Web**: [https://yupiboard.localhost](https://yupiboard.localhost)
- **API Swagger**: [https://api.yupiboard.localhost/docs](https://api.yupiboard.localhost/docs)
- **Traefik Dashboard**: [https://traefik.yupiboard.localhost/dashboard/](https://traefik.yupiboard.localhost/dashboard/)

---

## 📜 Key Commands (pnpm / package.json)

| Command              | Description                                                          |
| -------------------- | -------------------------------------------------------------------- |
| `pnpm run setup`     | Generate SSL certificates, install pnpm dependencies, and `uv sync`  |
| `pnpm docker:up`     | Start PostgreSQL, Traefik, Mailpit, and pgweb in the background      |
| `pnpm docker:down`   | Stop Docker containers                                               |
| `pnpm docker:down:v` | Stop Docker containers and remove persistent volumes                 |
| `pnpm migrate`       | Apply Alembic migrations                                             |
| `pnpm generate:api`  | Export `openapi.json` from FastAPI and run Orval code generation     |
| `pnpm dev:backend`   | Start FastAPI server via `uv run fastapi dev`                        |
| `pnpm dev:frontend`  | Start Vite dev server (`pnpm dev`)                                   |
| `pnpm test`          | Run backend tests (`pytest`)                                         |
| `pnpm lint`          | Run linters: `oxlint` for React, `ruff` and `ty` for Python          |
| `pnpm format`        | Format backend code (`ruff format`)                                  |
| `pnpm mobile:copy`   | Build frontend and copy bundle to Capacitor                          |
| `pnpm mobile:sync`   | Build frontend and sync Capacitor plugins/web assets                 |

---

## 🔒 Authentication & Security

- **Sign Up / Sign In**: Issues a short-lived `access_token` (JWT) and a long-lived `refresh_token`.
- **Web**: The server automatically sets `refresh_token` in the `Set-Cookie` header with `HttpOnly; SameSite=Lax; Path=/api/v1/auth` flags, ensuring full protection against XSS attacks.
- **Mobile**: The `refresh_token` is also returned in the JSON response body, allowing Capacitor to store it in native secure storage using `@capacitor/preferences`.
- **Token Rotation**: Every request to `/api/v1/auth/refresh` invalidates the old token in the database and generates a new token pair with a unique `jti`.
