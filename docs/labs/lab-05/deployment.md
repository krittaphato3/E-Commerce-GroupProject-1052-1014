# Lab 5 Deployment Notes (CPE 334)

Status: first version, Episode 2 (cloud-ready code). GCP parts are TODO.

## 1. Stack summary

| Layer | Choice |
| --- | --- |
| Language / framework | TypeScript, Express 5 API; React 18 + Vite SPA (npm workspaces: `backend`, `frontend`) |
| Database / ORM | PostgreSQL 16, Prisma 6 (`prisma migrate deploy`) |
| Auth | Opaque random session token in the `cb_session` cookie; only its SHA-256 hash is stored in the `Session` table (no in-memory state, no signing secret) |
| File uploads | None (N/A) |
| Port | `PORT` env var (default 3000), bound to `0.0.0.0` |
| Probes | `GET /api/health` (no DB), `GET /api/ready` (200 if DB reachable, 503 if not) |

Deviation from the reference stack (Docker, Cloud Run, Cloud SQL for PostgreSQL, Secret Manager, GitHub Actions): none in the choice of components. The Dockerfile, Cloud Run, Cloud SQL, Secret Manager and the deploy workflow are not written yet.
TODO (later episode): decide how the SPA is served (same container vs. separate host) and set `CLIENT_ORIGIN`/`COOKIE_SECURE` accordingly.

## 2. Environment variables

| Name | Purpose | Secret? | Source |
| --- | --- | --- | --- |
| `PORT` | HTTP port | No | Local `.env`; Cloud Run sets it automatically |
| `NODE_ENV` | `development` / `test` / `production` | No | Local `.env`; Cloud Run env var |
| `DATABASE_URL` | PostgreSQL connection string | Yes | Local `.env`; Secret Manager |
| `TEST_DATABASE_URL` | Test DB (name must end `_test`) | No (local only) | Local `.env` |
| `CLIENT_ORIGIN` | CORS allowed origin | No | Local `.env`; Cloud Run env var |
| `SESSION_TTL_HOURS` | Session lifetime | No | Local `.env`; Cloud Run env var |
| `COOKIE_SECURE` | `true` over HTTPS | No | Local `.env`; Cloud Run env var |
| `BCRYPT_ROUNDS` | bcrypt cost (4-15) | No | Local `.env`; Cloud Run env var |
| `SEED_DEMO_DATA` | Seed demo data (default on locally, off in production) | No | Local `.env`; Cloud Run env var |
| `SEED_CUSTOMER_PASSWORD` | Demo customer password | Yes | Local `.env`; Secret Manager |
| `SEED_OPERATOR_PASSWORD` | Demo operator password | Yes | Local `.env`; Secret Manager |
| `API_PROXY_TARGET` | Vite dev proxy target | No | Local `.env` |
| `E2E_*`, `CAPTURE_EVIDENCE`, `BASE_URL` | Test/benchmark overrides | No | Local `.env` / CI |

## 3. Local commands

```bash
npm ci                                   # install
docker compose up -d postgres            # local database
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
