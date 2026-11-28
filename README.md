# Omazon — Online Food Ordering Platform

Omazon is an online food ordering platform designed for a university canteen, supporting role-based authentication, a menu that shows live stock availability, atomic ordering with inventory guarantees, simulated payment, and an operator workflow from acceptance to completion.

**Releases:** [`sprint-1-v1.0`](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/tree/sprint-1-v1.0) (login, menu, order, accept) and [`sprint-2-v2.0`](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/tree/sprint-2-v2.0) (catalog management, customer cancellation, simulated payment, fulfilment, quality gates). Sprint 3 order rejection (F-09) is on `sprint-3-staging` and not yet released. Current status: [`docs/features.md`](docs/features.md).

> Order numbers keep the `CB-` prefix by design (along with technical identifiers such as `cb_session` and `@campusbites.test` seed addresses) — see DEC-25 in [`docs/srs.md`](docs/srs.md).

---

## Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| **API** | Node.js >= 20.12, Express 5, TypeScript | Modular monolith; async errors propagate to one error handler |
| **Data access** | Prisma 6 | Migrations plus raw SQL `CHECK` constraints for `priceSatang > 0` and `stockQty >= 0` |
| **Database** | PostgreSQL 16 (Docker Compose) | `campusbites` for development, `campusbites_test` for tests |
| **Frontend** | React 18, TypeScript, Vite 6, Bootstrap 5 | Single-page application with role-based routing |
| **Authentication** | Server-side sessions, `bcryptjs`, httpOnly cookie `cb_session` | 8-hour session lifetime (`SESSION_TTL_HOURS`) |
| **Validation** | zod | Strict schemas; unknown fields are rejected, not ignored |
| **Tests** | Vitest, Supertest, Testing Library, Playwright | 242 backend, 89 frontend and 11 Playwright cases at `dad286b` (0 failed, 0 skipped) |
| **CI/CD** | GitHub Actions | [`ci.yml`](.github/workflows/ci.yml) (tests, coverage gate, E2E), [`ci-docker.yml`](.github/workflows/ci-docker.yml) (`test-and-docker`), [`deploy.yml`](.github/workflows/deploy.yml) (deploy to Cloud Run from `main`) |

---

## Architecture Overview

```mermaid
flowchart LR
    UI[React SPA<br/>localhost:5173] -- "JSON /api + cb_session cookie" --> API[Express 5 API<br/>localhost:3000]
    API --> MW[Session auth · role guard · zod validation · error handler]
    MW --> CT[Controllers]
    CT --> SV[Services: business rules, transactions]
    SV --> RP[Repositories: Prisma client]
    RP -- SQL --> DB[(PostgreSQL 16)]
```

- **Routes → controllers → services → repositories.** Controllers only translate HTTP; business rules and transactions live in services. Queries go through Prisma repositories, except order transactions, which use the Prisma transaction client inside the order service.
- **Access control is enforced twice.** Session and role middleware guard each route, and services re-check ownership (a customer can read only their own orders). `backend/src/routes/registry.ts` declares every route with its allowed roles, and TEST-43 fails if the registry and the mounted Express routes disagree.
- **One error shape.** Every failure returns `{ "error": { "code", "message", "details?" } }`; stack traces and SQL are never exposed.
- **Stock is reserved atomically.** Order submission runs in a transaction with a conditional stock update, so two concurrent orders for the last unit cannot both succeed (TEST-24).

Full design: [`docs/system-sds.md`](docs/system-sds.md).

---

## Quickstart Setup Guide (Fresh Clone)

Requires **Node.js >= 20.12** and **Docker** (PostgreSQL 16). Following the reproducibility specification (NFR-08), you can get the full application up, migrated, seeded, and tested in 8 commands or fewer:

```bash
# 1. Copy environment variables (the backend loads .env from its own folder)
cp backend/.env.example backend/.env

# 2. Start PostgreSQL 16 database
docker compose up -d

# 3. Install dependencies across workspaces (also runs `prisma generate`)
npm install

# 4. Apply database migrations
npm run db:migrate

# 5. Populate idempotent seed data (users & menu)
npm run db:seed

# 6. Run the test suite (unit & integration)
npm test

# 7. Start backend API server (http://localhost:3000)
npm run dev:backend

# 8. Start frontend dev server (http://localhost:5173)
npm run dev:frontend
```

Steps 7 and 8 stay in the foreground; open <http://localhost:5173> and log in with a seeded account below. NFR-08 verifies this sequence on a fresh clone; the seed step is additionally covered by TEST-45.

`backend/.env` arrives with the placeholder passwords `change-me-local`, and those values are fine for local development only. To use your own passwords, edit `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` in `backend/.env` after step 1 and before step 5; it is an edit, so the sequence stays at eight commands. The seed is create-only, so running it again does **not** change the password of an account that already exists; on a local database only, `npm run db:reset` recreates the accounts.

---

## Environment Variables

All configuration lives in a single file, `backend/.env`, copied from [`backend/.env.example`](backend/.env.example). Both backend and frontend tooling read it from there.

| Variable | Default in `.env.example` | Purpose |
|---|---|---|
| `PORT` | `3000` | API server port |
| `NODE_ENV` | `development` | Runtime mode; `production` blocks placeholder seed passwords |
| `SEED_DEMO_DATA` | commented out | Demo customers, second operator and fixture items (default on, off in production) |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Exact SPA origin allowed to send credentialed requests (CORS) |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites?schema=public` | Development database |
| `TEST_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public` | Test database. The name must end in `_test`; the test-database guards refuse anything else |
| `SESSION_TTL_HOURS` | `8` | Session lifetime and cookie `Max-Age` |
| `COOKIE_SECURE` | `false` | Must be `true` over HTTPS; defaults to `true` in production when unset |
| `BCRYPT_ROUNDS` | `10` | bcrypt cost factor |
| `SEED_CUSTOMER_PASSWORD` | `change-me-local` | Password for both seeded customer accounts |
| `SEED_OPERATOR_PASSWORD` | `change-me-local` | Password for both seeded operator accounts |

Optional Playwright overrides (all read from `backend/.env` or the shell, none required):

| Variable | Default | Purpose |
|---|---|---|
| `E2E_CUSTOMER_EMAIL` | `customer1@campusbites.test` | Customer used by the E2E journeys |
| `E2E_OPERATOR_EMAIL` | `operator1@campusbites.test` | Operator used by the E2E journeys |
| `E2E_API_PORT` | `3100` | Port for the API server Playwright starts |
| `E2E_FRONTEND_PORT` | `5174` | Port for the Vite server Playwright starts |
| `E2E_BASE_URL` | unset | Point Playwright at an already-running frontend instead |

---

## Seed Accounts & Test Credentials

The database seed (`npm run db:seed`) creates these synthetic accounts and stores only bcrypt hashes:

| Role | Email | Display Name |
|---|---|---|
| **Customer** | `customer1@campusbites.test` | Alice Customer |
| **Customer** | `customer2@campusbites.test` | Bob Customer |
| **Operator** | `operator1@campusbites.test` | Staff Operator 1 |
| **Operator** | `operator2@campusbites.test` | Staff Operator 2 |

Passwords are **not** stored in this repository. The seed reads `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` from `backend/.env` (copied from `backend/.env.example` in step 1). Replace the `change-me-local` placeholders with your own local values before seeding; all customers share the customer password and all operators share the operator password. The seed refuses to run when either value is missing, and refuses the placeholder value when `NODE_ENV=production`.

Playwright (TEST-09) reads the same two variables from `backend/.env`, so log in with the values you chose there.

---

The full variable list, including deployment and Playwright overrides, is in [`docs/sprints/sprint-3/release-readiness.md`](docs/sprints/sprint-3/release-readiness.md) §4.

---

## API Endpoints Added Since Sprint 1

| Endpoint | Role | Feature | State |
|---|---|---|---|
| `POST /api/menu-items`, `PATCH /api/menu-items/:id` | Operator | F-05 catalog management (screen `/operator/menu`) | `sprint-2-v2.0` |
| `POST /api/orders/:id/cancel` | Customer (owner) | F-06 cancel a `PENDING` order; stock restored | `sprint-2-v2.0` |
| `POST /api/orders/:id/pay` | Customer (owner) | F-07 simulated payment of an `ACCEPTED` order, once, no card data | `sprint-2-v2.0` |
| `POST /api/orders/:id/start`, `/ready`, `/complete` | Operator | F-08 `ACCEPTED → PREPARING → READY → COMPLETED` (start needs `PAID`) | `sprint-2-v2.0` |
| `GET /api/ready` | Anonymous | Database readiness probe | `sprint-2-v2.0` |
| `POST /api/orders/:id/reject` | Operator | F-09 reject a `PENDING` order with a 5–200 character reason; stock restored | `sprint-3-staging` |

Full endpoint list and permission matrix: [`docs/system-sds.md`](docs/system-sds.md) §4 and §5.

---

## Testing Guide

| Level | Command | Scope and tests |
|---|---|---|
| **Unit + API/database integration** (default) | `npm test` | Runs both workspaces. The backend `pretest` migrates `campusbites_test` first. Which test file covers each acceptance criterion is in [`docs/traceability.md`](docs/traceability.md) §7 |
| **Backend only** | `npm test --workspace=backend` | Vitest + Supertest against the real PostgreSQL test database (no mocked SQL) |
| **Frontend components** | `npm test --workspace=frontend` | Vitest + Testing Library: screens, guards and the app shell |
| **Coverage gate (COV-01)** | `npm run coverage --workspace=backend` | All backend tests with line coverage of `backend/src/services`; fails below 85% (NFR-10). Report in `backend/coverage/` (CI artifact `backend-coverage`) |
| **Route access meta-test (R-01)** | `npm run test --workspace=backend -- tests/routes.access.test.ts` | TEST-43: every protected route answers 401 anonymously and 403 for each disallowed role, and the route registry matches the mounted Express routes |
| **End-to-end** | `npm run e2e` | Playwright journeys: TEST-09, 12, 29, 41, 42, 57, 67, 76, 87, 104, plus the AC-21/AC-30 stale-cart journey |
| **Type check** | `npm run typecheck` | `tsc --noEmit` across both workspaces |
| **Production build** | `npm run build` | Backend `tsc` emit and Vite bundle |
| **Load benchmark** | `npm run bench:nfr05` | NFR-05 / LOAD-01: autocannon against `GET /api/menu` and `POST /api/orders`, 20 connections for 30 s per endpoint, 5 runs each. Needs the built API on port 3100 (`PORT=3100 node dist/server.js`) and the benchmark seed (`npm run db:seed --workspace=backend -- --with-perf-orders`, 500 orders plus a high-stock order-test item; the flag must be passed to the backend workspace directly, because the root `db:seed` wrapper does not forward it). Evidence is written to `docs/evidence/nfr05/` |

Latest recorded run (`dad286b`, local, 2026-11-28): **242 backend tests in 28 files**, **89 frontend tests in 9 files** and **11 Playwright journeys**, all passing with none skipped; service line coverage 97.79%. Results per requirement are in [`docs/traceability.md`](docs/traceability.md); raw output is in [`docs/evidence/RC-pre-release-dad286b.txt`](docs/evidence/RC-pre-release-dad286b.txt).

Notes:

- `npm test` needs the Docker database from the quickstart running. The backend `pretest` script applies migrations to `TEST_DATABASE_URL`; it never touches the development database.
- **`npm test` and `npm run e2e` must never run concurrently**: both use the `*_test` database. Running them one after the other is safe, because Playwright's `globalSetup` resets the database at the start of every E2E run.

---

## End-to-End Tests (Playwright)

Install the Playwright browser once, then run the journeys:

```bash
# One-time browser install
npm run e2e:install --workspace=frontend

# Run the Playwright suite (starts its own servers on dedicated ports)
npm run e2e
```

The suite has eleven journeys in `frontend/e2e/`: `auth.spec.ts` (TEST-09), `menu.spec.ts` (TEST-12), `order.spec.ts` (TEST-29 and the AC-21/AC-30 stale-cart 409 journey), `operator.spec.ts` (TEST-41, TEST-42), `catalog.spec.ts` (TEST-57), `cancel.spec.ts` (TEST-67), `payment.spec.ts` (TEST-76), `fulfilment.spec.ts` (TEST-87) and `reject.spec.ts` (TEST-104).

- Credentials come only from environment variables: `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` are read from `backend/.env`. Optional `E2E_CUSTOMER_EMAIL` and `E2E_OPERATOR_EMAIL` override the seeded emails (defaults: `customer1@campusbites.test`, `operator1@campusbites.test`).
- The seeded accounts must exist in the development database (`npm run db:seed`) with the same passwords.
- Playwright runs against `TEST_DATABASE_URL` (the `*_test` database), never the development database. Its `globalSetup` applies migrations, truncates the tables and re-seeds them with the `backend/.env` passwords before the first test, so the seed stock is identical on every run. `globalSetup` is the only migration owner; the `webServer` command does not migrate, so exactly one migration step runs per run.
- Playwright starts the API on port 3100 and Vite on port 5174 so a running development server is not disturbed. Override with `E2E_API_PORT` and `E2E_FRONTEND_PORT`, or point `E2E_BASE_URL` at an already-running frontend.
- Screenshots for the evidence pack are captured by `frontend/e2e/evidence.ts` into `docs/evidence/`.

### Troubleshooting: leftover E2E servers

Playwright sets `reuseExistingServer: false` for the API (port 3100) so a run can never attach to a server pointed at the development database. If a previous run crashed, its process can keep the port and the next run fails immediately with a port-in-use error. Find and stop the leftovers, then re-run:

```bash
# macOS / Linux
lsof -ti:3100,5174 | xargs kill
```

```powershell
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3100,5174 |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force }
```

---

## Repository Structure

```text
├── package.json          # Root workspace configuration
├── docker-compose.yml    # PostgreSQL 16 service
├── backend/              # Node.js + Express + Prisma modular monolith API
│   ├── .env.example      # Baseline environment template (copy to backend/.env)
│   ├── prisma/           # Schema, migrations (with raw SQL CHECK constraints), and seed script
│   ├── src/              # Routes, controllers, services, repositories, and middleware
│   └── tests/            # Supertest & Vitest integration test suite
├── frontend/             # React 18 + TypeScript + Vite + Bootstrap 5 SPA
│   ├── e2e/              # Playwright journeys and the evidence screenshot helper
│   └── src/              # Pages, components, routing, and their unit/component tests (*.test.tsx)
└── docs/                 # SRS, System SDS, Feature contracts, Traceability matrix
    └── evidence/         # Screenshots and terminal logs from all sprints (README.md there indexes Sprint 1)
```

---

## Available Scripts

- `npm run build`: Compile TypeScript and build client and server.
- `npm run typecheck`: Run TypeScript compiler checks with zero emit across all workspaces.
- `npm test`: Execute Vitest test suites.
- `npm run e2e`: Run the Playwright end-to-end tests.
- `npm run db:migrate`: Apply pending Prisma migrations to the active database.
- `npm run db:seed`: Run idempotent seed script.
- `npm run db:reset`: Drop, re-migrate, and re-seed database.

---

## Documentation and Deliverables

| Document | Purpose |
|---|---|
| [`docs/srs.md`](docs/srs.md) | Software Requirements Specification: actors, FR, BR, NFR, order lifecycle, decisions |
| [`docs/system-sds.md`](docs/system-sds.md) | System-level design: architecture, data model, API and UI conventions, test strategy |
| [`docs/features.md`](docs/features.md) | Whole-product feature inventory and system responsibilities |
| [`docs/sprints/plan.md`](docs/sprints/plan.md) | Three-sprint plan, dependencies and risks |
| [`docs/sprints/sprint-1/features.md`](docs/sprints/sprint-1/features.md) | Sprint 1 engineering contracts, acceptance criteria and test specifications |
| [`docs/sprints/sprint-2/features.md`](docs/sprints/sprint-2/features.md) | Sprint 2 contracts (AC-47 to AC-92) |
| [`docs/sprints/sprint-3/features.md`](docs/sprints/sprint-3/features.md) | Sprint 3 contracts (AC-93 to AC-147) |
| [`docs/sprints/sprint-3/release-readiness.md`](docs/sprints/sprint-3/release-readiness.md) | Release readiness, setup summary and remaining-work plan |
| [`docs/traceability.md`](docs/traceability.md) | Requirement → AC → test → result matrix and status of AC-01 to AC-147 |
| [`docs/change-register.md`](docs/change-register.md) | Change and defect register, Sprint 1 continuity |
| [`docs/labs/lab-05/deployment.md`](docs/labs/lab-05/deployment.md) | Cloud deployment, release, rollback and demo accounts |
| [`docs/evidence/README.md`](docs/evidence/README.md) | Evidence pack index: screenshots, red/green logs, workflow evidence |

The deliverable document is assembled locally from these Markdown sources and submitted outside this repository; it is **not** part of GitHub. The handout requires the submitted file as a **PDF**, so the assembled document is exported to PDF before submission. The `docs/deliverable-1/` folder (the working `.docx` and the scripts that build it) is Git-ignored on purpose, so the Markdown files above remain the tracked, reviewable record.

---

## Known Limitations

- **Not built yet (Sprint 3):** order search, filter and pagination (F-10), sales summary (F-11), operator cancellation and refund (F-12), login throttling (F-13). There is currently no limit on login attempts, no code path to `REFUNDED`, and order lists return at most 200 rows.
- **R-04 not done:** NFR-05 has only the local Sprint 1 baseline, `PASS (S1 baseline)` ([`docs/evidence/nfr05/`](docs/evidence/nfr05/summary.json)), with no measurement of the deployed build; loading, empty and error states are not yet verified on all screens (NFR-09).
- **FND-01 ([#50](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/50)):** an unbroken 200-character pickup note overflows horizontally on order detail.
- **DEF-01:** on the deployed system, the current Secret Manager password values do not log in to the demo accounts; see [`docs/change-register.md`](docs/change-register.md).
- **CI:** pull requests into `sprint-3-staging` run `ci.yml` only, not `test-and-docker`.
- **Seed:** renaming a seeded menu item makes the next seed run create the original again (DEC-32).

---

## Deployment Notes

- **`CLIENT_ORIGIN`**: Defaults to `http://localhost:5173` for local development. The Cloud Run deployment serves the SPA and API from one origin and leaves it unset, which disables CORS. Set it, to the exact SPA origin, only when the frontend is served from another origin.
- Release, rollback and verification steps: [`docs/labs/lab-05/deployment.md`](docs/labs/lab-05/deployment.md).

- `npm run db:generate`: Regenerate the Prisma client (runs automatically after `npm install`).
