# Lab 5 Deployment Notes (CPE 334)

Status: Episode 3 (containerized with Docker). GCP parts are TODO.

## 1. Stack summary

| Layer | Choice |
| --- | --- |
| Language / framework | TypeScript, Express 5 API; React 18 + Vite SPA (npm workspaces: `backend`, `frontend`) |
| Database / ORM | PostgreSQL 16, Prisma 6 (`prisma migrate deploy`) |
| Auth | Opaque random session token in the `cb_session` cookie; only its SHA-256 hash is stored in the `Session` table (no in-memory state, no signing secret) |
| File uploads | None (N/A) |
| Port | `PORT` env var (default 3000), bound to `0.0.0.0` |
| Probes | `GET /api/health` (no DB), `GET /api/ready` (200 if DB reachable, 503 if not) |

Deviation from the reference stack (Docker, Cloud Run, Cloud SQL for PostgreSQL, Secret Manager, GitHub Actions): none in the choice of components.
Containerization:
- Multi-container Docker Compose for development and end-to-end testing: `postgres` (PostgreSQL 16), `backend` (Express 5 API on :3000), and `frontend` (Nginx serving SPA and proxying `/api` on :5173).
- Single-container multi-stage root `Dockerfile` for Cloud Run (Node 22 runtime serving API and built SPA static files from the same origin).
The Cloud Run, Cloud SQL, Secret Manager and the deploy workflow are scheduled for later episodes.

### Seed and deploy notes
- The Cloud Run migration job runs `migrate` + `seed` on every release. The seed is create-only for users (an existing user's password hash is never changed); menu data is create-only.
- With `NODE_ENV=production` and `SEED_DEMO_DATA` unset or `false`, the seed creates only the operator account `operator1@campusbites.test`, using `SEED_OPERATOR_PASSWORD`. That variable must be set and must not be the `change-me-local` placeholder. Demo customers, the second operator and the test-fixture menu items are skipped.
- `SEED_DEMO_DATA=true` is needed on the cloud job only when demo accounts are wanted (Lab 6); it also requires `SEED_CUSTOMER_PASSWORD`.
- `COOKIE_SECURE` defaults to `true` when `NODE_ENV=production` (and `false` otherwise); an explicit value wins. It must be `true` behind HTTPS (Cloud Run). The repo's `docker-compose.yml` only runs PostgreSQL and does not set `NODE_ENV`, so local runs are unaffected.
- CORS: in production with `CLIENT_ORIGIN` unset, CORS is disabled (same-origin deployment). Outside production the default is `http://localhost:5173` with credentials.
- Seeding never overwrites existing users or menu items. Without demo data it creates the first operator and the four starter menu items; the sold-out/last-unit/delisted fixture items are demo-only. `SEED_DEMO_DATA` accepts `true`/`false`/`1`/`0`; any other value (for example `ture`) makes the seed fail.
- `/api/ready` runs `SELECT 1` with a 2 second timeout (503 on failure or timeout), sends `Cache-Control: no-store`, and logs only an error code and redacted message, never a connection string.

## 2. Environment variables

| Name | Purpose | Secret? | Source |
| --- | --- | --- | --- |
| `PORT` | HTTP port | No | Local `.env`; Cloud Run sets it automatically |
| `NODE_ENV` | `development` / `test` / `production` | No | Local `.env`; Cloud Run env var |
| `DATABASE_URL` | PostgreSQL connection string | Yes | Local `.env`; Secret Manager |
| `TEST_DATABASE_URL` | Test DB (name must end `_test`) | No (local only) | Local `.env` |
| `CLIENT_ORIGIN` | CORS allowed origin; optional in production (unset disables CORS) | No | Local `.env`; Cloud Run env var |
| `SESSION_TTL_HOURS` | Session lifetime | No | Local `.env`; Cloud Run env var |
| `COOKIE_SECURE` | Defaults to `true` in production; must be `true` behind HTTPS | No | Local `.env`; Cloud Run env var |
| `BCRYPT_ROUNDS` | bcrypt cost (4-15) | No | Local `.env`; Cloud Run env var |
| `SEED_DEMO_DATA` | Seed demo data (default on locally, off in production) | No | Local `.env`; Cloud Run env var |
| `SEED_CUSTOMER_PASSWORD` | Demo customer password | Yes | Local `.env`; Secret Manager |
| `SEED_OPERATOR_PASSWORD` | Demo operator password | Yes | Local `.env`; Secret Manager |
| `API_PROXY_TARGET` | Vite dev proxy target (default `http://localhost:3000`) | No | Shell only, e.g. `API_PROXY_TARGET=http://localhost:8080 npm run dev:frontend`; not read from `backend/.env` |
| `E2E_*`, `CAPTURE_EVIDENCE` | Playwright overrides | No | `backend/.env` (loaded by `frontend/playwright.config.ts`) or shell |
| `BASE_URL` | NFR-05 benchmark target | No | `backend/.env` (loaded by `backend/benchmarks/nfr05-load.js`) or shell |

## 3. Local commands

### Docker Compose (Full Stack)

```bash
docker compose up --build -d             # build and start postgres, backend, and frontend
docker compose ps                        # check container status and health
docker compose logs -f backend           # follow backend logs and migration status
curl http://localhost:3000/api/health    # probe backend health directly
curl http://localhost:3000/api/ready     # probe backend readiness (DB check)
curl http://localhost:5173/api/health    # probe health via frontend Nginx proxy
docker compose down                      # stop containers (database volume persists)
```

### Local Development (without Docker for app services)

```bash
npm ci                                   # install
docker compose up -d postgres            # local database only
cp backend/.env.example backend/.env     # then set local seed passwords
npm run db:migrate                       # apply migrations
npm run db:seed                          # seed demo data (idempotent)
npm run dev:backend                      # run API on :3000
npm run dev:frontend                     # run SPA on :5173
npm run build                            # build both workspaces
npm test                                 # unit + integration tests
npm run e2e                              # Playwright (needs e2e:install once)
```

## 4. GCP placeholders (TODO, later episode)

- GCP project ID: `TODO`
- Region: `TODO`
- Resource names (Artifact Registry repo, Cloud Run service, Cloud SQL instance, secrets): `TODO`
- Release procedure: `TODO`
- How to find the running commit: `TODO` (for example, an image tag or a revision label set to the git SHA)
