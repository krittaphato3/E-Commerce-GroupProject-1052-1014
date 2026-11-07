# Omazon — System-Level Software Design Specification (SDS)

| Item | Value |
|---|---|
| Document | `docs/system-sds.md` |
| Version | 1.3 |
| Date | 2026-11-07 |
| Related | `docs/srs.md`, `docs/features.md`, `docs/sprints/sprint-1/features.md`, `docs/sprints/plan.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial system design | Deliverable 1 |
| 1.1 | 2026-11-05 | AC-43 coverage claim limited to the Sprint 1 rows; cookie `Max-Age` documented as derived from `SESSION_TTL_HOURS` | Audit corrections: remove an unsupported test claim and reconcile session configuration |
| 1.2 | 2026-11-07 | Update route guard summary: wrong-role routes show an in-place 403 Forbidden alert from ProtectedRoute ("403 Forbidden: You have no access to this page.") rather than redirect to the role home, consistent with F-04 contract and AC-42 (DEC-23, Option A) | Reconcile system SDS with ProtectedRoute behavior and AC-42 contract revision |
| 1.3 | 2026-11-07 | Document title uses the Omazon display name | Display brand rename (DEC-25); no design content changed |

---

## 1. Architecture and stack

### 1.1 Selected stack (DEC-02)
| Layer | Technology | Why |
|---|---|---|
| UI | React 18 + TypeScript + Vite, Bootstrap 5, React Router | Same as Labs 1–4; fast to build |
| API / application layer | Node.js + Express + TypeScript, zod for validation | Same as Labs 1–4; strict typed schemas |
| Database | PostgreSQL 16 + Prisma ORM and migrations | Transactions, CHECK constraints, row-level atomic updates |
| Auth | bcryptjs password hashing, server-side sessions, httpOnly cookie | Testable logout (DEC-05) |
| Tests | Vitest (unit, component), Supertest (API + DB), Playwright (end-to-end) | Covers the three required test levels |
| Packaging | Docker (multi-stage), docker compose for local DB | Required for Lab 5 |

A **modular monolith**: one Express application serves the JSON API and, in production, the built React files. One database.

### 1.2 Component diagram
```mermaid
flowchart LR
    B[Browser: React SPA] -- "HTTPS JSON /api, cookie cb_session" --> R[Express routes]
    subgraph API[Express application]
        R --> M[Middleware: session auth, role guard, zod validation, error handler]
        M --> C[Controllers]
        C --> S[Services: business rules, transactions]
        S --> P[Repositories: Prisma client]
    end
    P -- SQL --> D[(PostgreSQL)]
```

### 1.3 Responsibilities and communication
| Component | Responsibility | Must not |
|---|---|---|
| React SPA | Screens, cart state, form validation for convenience, route guards for navigation, calls `/api` with `fetch` and `credentials: "include"` | Decide permissions, calculate authoritative totals, trust its own role value |
| Routes + middleware | Map URL and method to controller, authenticate session, check role, validate body with zod, convert errors to the standard shape | Contain business rules |
| Controllers | Read validated input, call one service, shape the response | Access the database directly |
| Services | **All business rules**: availability, stock reservation, totals, ownership checks, state machine, history, transactions | Know about HTTP |
| Repositories (Prisma) | Persistence and queries | Contain rules |
| PostgreSQL | Durable data, relationships, constraints (CHECK, UNIQUE, FK) as the last line of defense | — |

The browser and API communicate only through JSON over HTTP. In development Vite proxies `/api` to the Express port, so the cookie is same-origin.

### 1.4 Where each rule is enforced
| Rule | Service | DB constraint | Notes |
|---|---|---|---|
| BR-01 quantity and line limits | Yes | CHECK `quantity BETWEEN 1 AND 10`; UNIQUE `(orderId, menuItemId)` | zod also rejects first |
| BR-02 availability | Yes (inside transaction) | — | Whole order rolls back on failure |
| BR-03 total | Yes (`calculateOrderTotal`) | — | Client fields rejected (DEC-07) |
| BR-04 price snapshot | Yes | `OrderItem.unitPriceSatang` stored | |
| BR-05 stock atomic | Conditional `updateMany` where `stockQty >= qty` | CHECK `stockQty >= 0` | Race-safe |
| BR-06 transitions | Yes (`assertTransition`) | Conditional update `where status = expected` | Blocks double accept |
| BR-07, BR-08 access | Role guard + ownership check | — | Never in the frontend only |
| BR-14 order number | Yes (format from id) | — | |
| BR-15 history | Yes, same transaction | — | |

## 2. Data design

### 2.1 Entity-relationship diagram
```mermaid
erDiagram
    User ||--o{ Session : has
    User ||--o{ Order : places
    User ||--o{ OrderStatusHistory : acts
    Order ||--|{ OrderItem : contains
    Order ||--|{ OrderStatusHistory : logs
    MenuItem ||--o{ OrderItem : "ordered as"
    User {
        int id PK
        string email UK
        string displayName
        string passwordHash
        enum role "CUSTOMER or OPERATOR"
        datetime createdAt
    }
    Session {
        int id PK
        int userId FK
        string tokenHash UK
        datetime expiresAt
        datetime createdAt
    }
    MenuItem {
        int id PK
        string name UK
        string description
        int priceSatang "CHECK > 0"
        int stockQty "CHECK >= 0"
        boolean isAvailable
        datetime createdAt
        datetime updatedAt
    }
    Order {
        int id PK
        int customerId FK
        enum status
        enum paymentStatus
        int totalSatang
        string pickupNote "max 200"
        datetime createdAt
        datetime updatedAt
    }
    OrderItem {
        int id PK
        int orderId FK
        int menuItemId FK
        string itemName "snapshot"
        int unitPriceSatang "snapshot"
        int quantity "CHECK 1..10"
        int lineTotalSatang
    }
    OrderStatusHistory {
        int id PK
        int orderId FK
        enum fromStatus "nullable"
        enum toStatus
        int actorId FK
        enum actorRole
        string note "nullable, rejection reason in S3"
        datetime createdAt
    }
```

### 2.2 Entities, constraints and ownership
| Entity | Key constraints | Ownership / access |
|---|---|---|
| User | `email` unique, lowercased; `role` in (`CUSTOMER`, `OPERATOR`); `passwordHash` is a bcrypt hash | Never returned by the API except id, email, displayName, role |
| Session | `tokenHash` unique (SHA-256 of the random token); `expiresAt` = created + 8 hours; cascade delete with user | Internal only |
| MenuItem | `name` unique; CHECK `priceSatang > 0`; CHECK `stockQty >= 0` | Public read; Operator write (Sprint 2) |
| Order | FK `customerId`; `status` enum: `PENDING, ACCEPTED, REJECTED, CANCELLED, PREPARING, READY, COMPLETED`; `paymentStatus` enum: `UNPAID, PAID, REFUNDED`; `totalSatang >= 0` | Owner = `customerId`. Customer sees own; Operator sees all |
| OrderItem | UNIQUE `(orderId, menuItemId)`; CHECK `quantity BETWEEN 1 AND 10`; price and name snapshot | Follows the order |
| OrderStatusHistory | Append-only; FK to order and actor | Follows the order |

Money is stored as integer satang. The UI formats it as THB (for example `6000` → `฿60.00`).

### 2.3 Database setup, migrations and seed
- **Migrations:** Prisma migrations in `backend/prisma/migrations`. CHECK constraints are added as raw SQL in the migration file (Prisma has no native CHECK).
- **Commands:** `npx prisma migrate deploy` (apply), `npm run db:reset` (drop, migrate, seed — local and test only).
- **Seed (`backend/prisma/seed.ts`)** is idempotent (uses upsert) and creates only synthetic data:

| Seed data | Values |
|---|---|
| Users | `customer1@campusbites.test`, `customer2@campusbites.test` (CUSTOMER); `operator1@campusbites.test`, `operator2@campusbites.test` (OPERATOR). Passwords come from `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` in `.env`; never committed. |
| Menu (name, satang, stock) | Basil Pork Rice 6000/30; Green Curry with Rice 6500/25; Fried Rice with Egg 5500/30; Thai Iced Tea 3000/50; Mango Sticky Rice 8000/1; Chicken Sandwich 7000/0 (sold out); Pad Thai 6000/20 with `isAvailable = false` |

- **Tests** use a separate database `campusbites_test`; each test file resets it with a helper.

## 3. UI conventions

### 3.1 Screens and navigation
| Route | Screen | Roles | Sprint |
|---|---|---|---|
| `/login` | Login form | Anonymous | 1 |
| `/menu` | Menu with cart and order form | Anonymous (view); Customer (order) | 1 |
| `/orders` | My orders list | Customer | 1 |
| `/orders/:id` | Order detail with items, totals, history | Customer (own), Operator (any) | 1 |
| `/operator/orders` | Incoming orders table with status filter and Accept | Operator | 1 |
| `/operator/menu` | Catalog management | Operator | 2 |
| `/operator/reports` | Sales summary | Operator | 3 |

Header: shop name, links by role, display name and role badge, Logout button. After login: Customer goes to `/menu`, Operator goes to `/operator/orders`.

### 3.2 Shared UI behavior
| Behavior | Rule |
|---|---|
| Loading | Spinner or "Loading…" text while a request is pending; buttons disabled during submit |
| Empty | Explicit text, for example "You have no orders yet." |
| Error | Alert box showing the API `error.message`; a generic message for network or 500 errors |
| Validation | Client checks (quantity 1–10, note length) for convenience only; the server is authoritative |
| Money | Formatted from satang to `฿` with 2 decimals |
| Status | Colored badge per status |
| Route guards | Redirect to `/login` if not logged in; show an in-place 403 Forbidden alert from `ProtectedRoute` ("403 Forbidden: You have no access to this page.") and suppress role content on a wrong-role route. **This is navigation only, not authorization.** |

## 4. API conventions

| Topic | Convention |
|---|---|
| Base path | `/api` (no version prefix) |
| Format | JSON request and response, `Content-Type: application/json`; field names camelCase; timestamps ISO-8601 UTC |
| Auth | Cookie `cb_session`; no client-supplied user id or role anywhere |
| Success | `200` read/update, `201` create, `204` no content |
| Request validation | zod `.strict()` schemas: unknown fields cause 400 |
| Error shape | `{ "error": { "code": "STRING_CODE", "message": "human text", "details": { } } }` (`details` optional) |
| Safe errors | 500 returns `INTERNAL_ERROR` with a generic message; details go to server logs only |
| Lists (Sprint 1) | No pagination; at most 200 rows. Pagination arrives with F-10 |

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed JSON, schema violation, invalid id or enum |
| 401 | `UNAUTHENTICATED` | No valid session |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (login only) |
| 403 | `FORBIDDEN` | Wrong role or not the owner |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `ITEM_UNAVAILABLE` | Item disabled or stock too low |
| 409 | `INVALID_TRANSITION` | Status change not allowed |
| 429 | `TOO_MANY_ATTEMPTS` | Login throttled (Sprint 3) |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

### Endpoint summary (detail is in the feature contracts)
| Method and path | Role | Feature | Sprint |
|---|---|---|---|
| `POST /api/auth/login` | Anonymous | F-01 | 1 |
| `POST /api/auth/logout` | Any | F-01 | 1 |
| `GET /api/auth/me` | Authenticated | F-01 | 1 |
| `GET /api/health` | Anonymous | R-03 | 1 |
| `GET /api/menu` | Anonymous | F-02 | 1 |
| `POST /api/orders` | Customer | F-03 | 1 |
| `GET /api/orders/mine` | Customer | F-03 | 1 |
| `GET /api/orders/:id` | Customer (owner), Operator | F-03, F-04 | 1 |
| `GET /api/orders` | Operator | F-04 | 1 |
| `POST /api/orders/:id/accept` | Operator | F-04 | 1 |
| `POST/PATCH /api/menu-items…` | Operator | F-05 | 2 |
| `POST /api/orders/:id/cancel`, `/pay`, `/start`, `/ready`, `/complete` | see matrix | F-06..F-08 | 2 |
| `POST /api/orders/:id/reject`, reports, operator cancel | Operator | F-09, F-11, F-12 | 3 |

## 5. Role and permission matrix

`Y` = allowed. `Own` = only records the user owns. `—` = rejected (401 if anonymous, 403 if logged in).

| Operation | Anonymous | Customer | Operator | Sprint |
|---|---|---|---|---|
| Log in | Y | Y | Y | 1 |
| Log out | Y (no-op) | Y | Y | 1 |
| Get current user | — (401) | Y | Y | 1 |
| View menu | Y | Y | Y | 1 |
| Submit order | — | Y | — | 1 |
| List my orders | — | Own | — | 1 |
| View order detail | — | Own | Any | 1 |
| List all orders | — | — | Y | 1 |
| Accept order | — | — | Y | 1 |
| Create/edit menu item | — | — | Y | 2 |
| Cancel order | — | Own, `PENDING` only | Any `ACCEPTED` (S3) | 2, 3 |
| Pay order (simulated) | — | Own | — | 2 |
| Start / ready / complete | — | — | Y | 2 |
| Reject order | — | — | Y | 3 |
| Sales summary | — | — | Y | 3 |

A hidden button is not authorization. Sprint 1 rows are enforced by backend middleware and services and covered by AC-43; Sprint 2–3 rows will be added to the same route-registry test when their endpoints are implemented.

## 6. Authentication design

| Topic | Design |
|---|---|
| Credentials | Email (case-insensitive) and password sent over HTTPS in a JSON body |
| Password hashing | `bcryptjs`, cost 10 (`BCRYPT_ROUNDS`; tests use 4 for speed). No plaintext stored or logged |
| Login | Look up user, compare hash. On success create a random 32-byte token, store its SHA-256 hash in `Session` with `expiresAt = now + 8h`, send the raw token in cookie `cb_session` |
| Cookie | `HttpOnly; SameSite=Lax; Path=/`; `Max-Age` is derived from `SESSION_TTL_HOURS` (28800 s at the default 8 h); `Secure` in production |
| Failed login | Same `401 INVALID_CREDENTIALS` and same message for unknown email and wrong password |
| Current user | Middleware reads the cookie, hashes it, finds a non-expired `Session`, loads the user. Role is read from the database, never from the client |
| Expiry | Expired sessions are rejected with 401 and may be deleted |
| Logout | Delete the `Session` row and clear the cookie. The old token returns 401 immediately |
| CSRF | `SameSite=Lax` cookie, JSON-only API, CORS restricted to the configured origin |
| Throttling | Sprint 3 (F-13) |

## 7. Configuration and delivery design

### 7.1 Environment variables
| Variable | Purpose | Example value in `.env.example` | Secret |
|---|---|---|---|
| `NODE_ENV` | `development`, `test`, `production` | `development` | No |
| `PORT` | API port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://campusbites:changeme@localhost:5432/campusbites` | Yes in production |
| `TEST_DATABASE_URL` | Test database | `postgresql://campusbites:changeme@localhost:5432/campusbites_test` | No (local) |
| `SESSION_TTL_HOURS` | Session lifetime | `8` | No |
| `COOKIE_SECURE` | `true` in production | `false` | No |
| `BCRYPT_ROUNDS` | Hash cost | `10` | No |
| `CLIENT_ORIGIN` | Allowed browser origin | `http://localhost:5173` | No |
| `SEED_CUSTOMER_PASSWORD` | Demo customer password | `change-me-local` | Yes (do not reuse) |
| `SEED_OPERATOR_PASSWORD` | Demo operator password | `change-me-local` | Yes (do not reuse) |

Real values live only in a local `.env` (git-ignored) and, in production, in GCP Secret Manager. `.env.example` contains placeholders only. Safe test accounts are given to graders through the private course handoff.

### 7.2 Planned deployment (finalised in Lab 5)
| Concern | Plan |
|---|---|
| Containers | Multi-stage `Dockerfile`: build frontend and backend, run one Node image that serves `/api` and the built SPA. `docker-compose.yml` for local PostgreSQL |
| CI | GitHub Actions on every PR: install, lint, build, run unit and API tests with a PostgreSQL service container, coverage report. A failed check blocks merge |
| CD | On merge to `main`: build image, push to Artifact Registry, run `prisma migrate deploy`, deploy to Cloud Run |
| Database | Cloud SQL for PostgreSQL (durable storage) |
| Secrets | GCP Secret Manager for `DATABASE_URL` and seed passwords |
| Release identification | Git tag plus commit SHA shown in `GET /api/health` (`{ "status": "ok", "version": "<sha>" }`) |

Exact GCP access will follow the Lab 5 instructions. The application is stateless apart from the database, so it is ready for this design.

### 7.3 Repository layout
```
campusbites/
  backend/   src/{routes,middleware,controllers,services,repositories}, prisma/, tests/
  frontend/  src/{pages,components,api}, tests/, e2e/
  docs/      srs.md, features.md, traceability.md, system-sds.md, sprints/plan.md, sprints/sprint-1/features.md
  docker-compose.yml, backend/.env.example, README.md
```

## 8. Test and workflow strategy

| Level | Tool | Used for |
|---|---|---|
| Unit | Vitest | Pure rules: total calculation, availability check, state machine, password helper |
| API + database integration | Vitest + Supertest on `campusbites_test` | Persistence, permissions, validation, concurrency, DB constraints |
| UI component | Vitest + React Testing Library | Empty, error and sold-out states |
| End-to-end | Playwright | Critical journeys: login, order, accept |

Git workflow: Issue → branch `feature/F-xx-name` from `sprint-1-staging` → PR to staging with teammate review → staging integration and system tests → release PR to `main` → tag `sprint-1-v1.0`. Commit order for each feature: contract commit, failing test commit (red), implementation commit (green).
