# CampusBites — Online Food Ordering Platform

CampusBites is an online food ordering platform designed for a university canteen, supporting role-based authentication, real-time menu management, atomic ordering with inventory guarantees, and order fulfillment workflows.

---

## Quickstart Setup Guide (Fresh Clone)

Following the reproducibility specification (NFR-08), you can get the full application up, migrated, seeded, and tested in 8 commands or fewer:

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

The database seed (`npm run db:seed`) creates default test accounts with bcrypt-hashed passwords:

| Role | Email | Password | Display Name |
|---|---|---|---|
| **Customer** | `customer1@campusbites.test` | `customer123!` | Alice Customer |
| **Customer** | `customer2@campusbites.test` | `customer123!` | Bob Customer |
| **Operator** | `operator1@campusbites.test` | `operator123!` | Staff Operator 1 |
| **Operator** | `operator2@campusbites.test` | `operator123!` | Staff Operator 2 |

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
- `npm run db:migrate`: Apply pending Prisma migrations to the active database.
- `npm run db:seed`: Run idempotent seed script.
- `npm run db:reset`: Drop, re-migrate, and re-seed database.
- `npm run db:generate`: Regenerate the Prisma client (runs automatically after `npm install`).
