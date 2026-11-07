# Omazon — Online Food Ordering Platform

Omazon is an online food ordering platform designed for a university canteen, supporting role-based authentication, real-time menu management, atomic ordering with inventory guarantees, and order fulfillment workflows.

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
| **Tests** | Vitest, Supertest, Testing Library, Playwright | 46 Sprint 1 tests across unit, integration, UI and E2E levels |
| **CI** | GitHub Actions | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs unit, integration and E2E sequentially |

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

- **Routes → controllers → services → repositories.** Controllers only translate HTTP; business rules and transactions live in services; all SQL goes through Prisma repositories.
- **Access control is enforced twice.** Session and role middleware guard each route, and services re-check ownership (a customer can read only their own orders). `backend/src/routes/registry.ts` declares every route with its allowed roles, and TEST-43 fails if the registry and the mounted Express routes disagree.
- **One error shape.** Every failure returns `{ "error": { "code", "message", "details?" } }`; stack traces and SQL are never exposed.
- **Stock is reserved atomically.** Order submission runs in a transaction with a conditional stock update, so two concurrent orders for the last unit cannot both succeed (TEST-24, TEST-40).

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

---

## Environment Variables

All configuration lives in a single file, `backend/.env`, copied from [`backend/.env.example`](backend/.env.example). Both backend and frontend tooling read it from there.

| Variable | Default in `.env.example` | Purpose |
|---|---|---|
| `PORT` | `3000` | API server port |
| `NODE_ENV` | `development` | Runtime mode; `production` blocks placeholder seed passwords |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Exact SPA origin allowed to send credentialed requests (CORS) |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites?schema=public` | Development database |
| `TEST_DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public` | Test database. The name must end in `_test`; the test-database guards refuse anything else |
| `SESSION_TTL_HOURS` | `8` | Session lifetime and cookie `Max-Age` |
| `COOKIE_SECURE` | `false` | Set `true` when serving over HTTPS |
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

## Testing Guide

| Level | Command | Scope and tests |
|---|---|---|
| **Unit + API/database integration** (default) | `npm test` | Runs both workspaces. The backend `pretest` migrates `campusbites_test` first. Sprint 1 backend: TEST-01 to TEST-08, TEST-10, TEST-11, TEST-14 to TEST-28, TEST-32 to TEST-40, TEST-43 to TEST-46; frontend components: TEST-13, TEST-30, TEST-31 |
| **Backend only** | `npm test --workspace=backend` | Vitest + Supertest against the real PostgreSQL test database (no mocked SQL) |
| **Frontend components** | `npm test --workspace=frontend` | Vitest + Testing Library: TEST-13, TEST-30, TEST-31 and the app shell |
| **Route access meta-test (R-01)** | `npm run test --workspace=backend -- tests/routes.access.test.ts` | TEST-43: every protected route answers 401 anonymously and 403 for each disallowed role, and the route registry matches the mounted Express routes |
| **End-to-end** | `npm run e2e` | Playwright journeys: TEST-09, TEST-12, TEST-29, TEST-41, TEST-42 |
| **Type check** | `npm run typecheck` | `tsc --noEmit` across both workspaces |
| **Production build** | `npm run build` | Backend `tsc` emit and Vite bundle |

Test counts from the latest recorded run (`c8fd8fc`): **84 backend tests in 15 files**, **36 frontend tests in 8 files**, and **6 Playwright journeys** — all passing. The per-feature statements of the 46 traceability tests are in [`docs/traceability.md`](docs/traceability.md), and the raw output is indexed in [`docs/evidence/README.md`](docs/evidence/README.md).

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

The suite covers five journeys in `frontend/e2e/`: `auth.spec.ts` (TEST-09), `menu.spec.ts` (TEST-12), `order.spec.ts` (TEST-29), and `operator.spec.ts` (TEST-41, TEST-42).

- Credentials come only from environment variables: `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` are read from `backend/.env`. Optional `E2E_CUSTOMER_EMAIL` and `E2E_OPERATOR_EMAIL` override the seeded emails (defaults: `customer1@campusbites.test`, `operator1@campusbites.test`).
- The seeded accounts must exist in the development database (`npm run db:seed`) with the same passwords.
- Playwright runs against `TEST_DATABASE_URL` (the `*_test` database), never the development database. Its `globalSetup` applies migrations, truncates the tables and re-seeds them with the `backend/.env` passwords before the first test, so the seed stock is identical on every run. `globalSetup` is the only migration owner; the `webServer` command does not migrate, so exactly one migration step runs per run.
- Playwright starts the API on port 3100 and Vite on port 5174 so a running `npm run dev` server is not disturbed. Override with `E2E_API_PORT` and `E2E_FRONTEND_PORT`, or point `E2E_BASE_URL` at an already-running frontend.
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
│   ├── src/              # Pages, components, routing
│   └── tests/            # Component and unit tests
└── docs/                 # SRS, System SDS, Feature contracts, Traceability matrix
    ├── evidence/         # Sprint 1 screenshots, terminal logs and their index
    └── deliverable-1/    # Assembled Deliverable 1 (Word) and its build script
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
| [`docs/traceability.md`](docs/traceability.md) | Requirement → AC → test → result matrix for all 46 Sprint 1 tests |
| [`docs/evidence/README.md`](docs/evidence/README.md) | Evidence pack index: screenshots, red/green logs, workflow evidence |
| [`docs/deliverable-1/Deliverable-1.docx`](docs/deliverable-1/) | Assembled Deliverable 1 (SRS, SDS, sprint plan, contracts, traceability, evidence) |

The Word document is generated from the Markdown files above, so the sources stay the single source of truth. Rebuild it after editing a document:

```bash
pip install python-docx          # one-time, Python 3.10+
python docs/deliverable-1/build_docx.py
```

The deliverable is kept as `.docx`; if a PDF is required, open it in Word and choose **File → Save As → PDF**.

---

## Known Limitations (Sprint 2 backlog)

These are known gaps in the R-01 route registry (`backend/src/routes/registry.ts`); the TEST-43 meta-test does not cover them yet, and fixing them is Sprint 2 work:

- **Nested sub-routers are not extracted.** `extractExpressRoutes` reads one level of `layer.handle.stack`. A router mounted inside another router (`router.use(...)` inside a router) is invisible to the meta-test.
- **A router mounted under two prefixes keeps only the last mount.** `mountRouter` stores one prefix per router in a `WeakMap`, so `extractExpressRoutes` reports the router once, under the prefix mounted last.

Sprint 1 scope stops at `PENDING → ACCEPTED`: payment, fulfilment, cancellation and rejection transitions are contract work for Sprints 2 and 3. The NFR-05 load benchmark (autocannon) is allocated to Sprint 3.

---

## Deployment Notes

- **`CLIENT_ORIGIN`**: Defaults to `http://localhost:5173` for local development. When deployed to staging or production, `CLIENT_ORIGIN` in `backend/.env` must match the exact SPA origin (protocol, domain, and port) so CORS allows credentialed session cookies and requests from the frontend.

- `npm run db:generate`: Regenerate the Prisma client (runs automatically after `npm install`).
