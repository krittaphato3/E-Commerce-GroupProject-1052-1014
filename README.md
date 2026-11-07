# Omazon — Online Food Ordering Platform

Omazon is an online food ordering platform designed for a university canteen, supporting role-based authentication, real-time menu management, atomic ordering with inventory guarantees, and order fulfillment workflows.

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

## End-to-end Test (F-01)

Install the Playwright browser once, then run the TEST-09 journey:

```bash
# One-time browser install
npm run e2e:install --workspace=frontend

# Run TEST-09 (starts its own servers on dedicated ports)
npm run e2e
```

- Credentials come only from environment variables: `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` are read from `backend/.env`. Optional `E2E_CUSTOMER_EMAIL` and `E2E_OPERATOR_EMAIL` override the seeded emails (defaults: `customer1@campusbites.test`, `operator1@campusbites.test`).
- The seeded accounts must exist in the development database (`npm run db:seed`) with the same passwords.
- Playwright runs against `TEST_DATABASE_URL` (the `*_test` database), never the development database. Its `globalSetup` truncates and re-seeds it with the `backend/.env` passwords before the first test, so the seed stock is identical on every run.
- **`npm test` and `npm run e2e` must never run concurrently**: both use the `*_test` database. Running them one after the other is safe, because `globalSetup` resets the database at the start of every E2E run.
- Playwright starts the API on port 3100 and Vite on port 5174 so a running `npm run dev` server is not disturbed. Override with `E2E_API_PORT` and `E2E_FRONTEND_PORT`, or point `E2E_BASE_URL` at an already-running frontend.

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
│   ├── src/              # Pages, components, routing
│   └── tests/            # Component and unit tests
└── docs/                 # SRS, System SDS, Feature contracts, Traceability matrix
```

---

## Available Scripts

- `npm run build`: Compile TypeScript and build client and server.
- `npm run typecheck`: Run TypeScript compiler checks with zero emit across all workspaces.
- `npm test`: Execute Vitest test suites.
- `npm run e2e`: Run the Playwright end-to-end tests (F-01 TEST-09).
- `npm run db:migrate`: Apply pending Prisma migrations to the active database.
- `npm run db:seed`: Run idempotent seed script.
- `npm run db:reset`: Drop, re-migrate, and re-seed database.

---

## Deployment Notes

- **`CLIENT_ORIGIN`**: Defaults to `http://localhost:5173` for local development. When deployed to staging or production, `CLIENT_ORIGIN` in `backend/.env` must match the exact SPA origin (protocol, domain, and port) so CORS allows credentialed session cookies and requests from the frontend.

- `npm run db:generate`: Regenerate the Prisma client (runs automatically after `npm install`).
