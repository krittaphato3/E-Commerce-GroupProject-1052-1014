# Omazon — System-Level Software Design Specification (SDS)

| Item | Value |
|---|---|
| Document | `docs/system-sds.md` |
| Version | 1.11 |
| Date | 2026-11-28 |
| Related | `docs/srs.md`, `docs/features.md`, `docs/sprints/sprint-1/features.md`, `docs/sprints/sprint-2/features.md`, `docs/sprints/sprint-3/features.md`, `docs/sprints/plan.md`, `docs/change-register.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial system design | Deliverable 1 |
| 1.1 | 2026-11-05 | AC-43 coverage claim limited to the Sprint 1 rows; cookie `Max-Age` documented as derived from `SESSION_TTL_HOURS` | Audit corrections: remove an unsupported test claim and reconcile session configuration |
| 1.2 | 2026-11-07 | Update route guard summary: wrong-role routes show an in-place 403 Forbidden alert from ProtectedRoute ("403 Forbidden: You have no access to this page.") rather than redirect to the role home, consistent with F-04 contract and AC-42 (DEC-23, Option A) | Reconcile system SDS with ProtectedRoute behavior and AC-42 contract revision |
| 1.3 | 2026-11-07 | Document title uses the Omazon display name | Display brand rename (DEC-25); no design content changed |
| 1.4 | 2026-11-10 | Correct the `DATABASE_URL` and `TEST_DATABASE_URL` examples to match `backend/.env.example`, and note that `GET /api/health` currently reports the literal `1.0.0` while the git SHA is wired in during Lab 5 | Documentation audit: the configuration table contradicted the shipped `.env.example` and the release-identification plan overstated what Sprint 1 returns (Issue #16) |
| 1.5 | 2026-11-27 | Endpoint summary lists the seven Sprint 2 endpoints and the permission matrix splits their rows, all marked "Sprint 2 — planned" | Sprint 2 contracts (Issue #53); nothing is implemented yet |
| 1.6 | 2026-11-28 | `POST /api/orders/:id/cancel` and the "Cancel own `PENDING` order" permission row are marked implemented | F-06 (Issue #55) |
| 1.7 | 2026-11-28 | `POST /api/orders/:id/pay` and its permission matrix row are marked implemented | F-07 (Issue #56) |
| 1.8 | 2026-11-28 | `POST /api/orders/:id/start`, `/ready`, `/complete` and the "Start / ready / complete" permission row are marked implemented; the `/operator/orders` screen row names the payment badge and fulfilment actions | F-08 (Issue #57) |
| 1.9 | 2026-11-28 | Endpoint summary replaces the combined Sprint 3 line with the reject, operator-cancel and sales-report endpoints, adds the changed list and login endpoints, and the permission matrix adds or details the Sprint 3 rows, all marked "Sprint 3 — planned" | Sprint 3 contracts (Issue #59); nothing is implemented yet |
| 1.10 | 2026-11-28 | `POST /api/orders/:id/reject` and the "Reject order" permission row are marked implemented; the other Sprint 3 rows stay planned | F-09 (Issue #59) |
| 1.11 | 2026-11-28 | Brought up to date with the code at `dad286b`: F-05 endpoints and permission row marked implemented; `/api/ready` added; data model notes, all CHECK constraints, indexes and the create-only seed; new §2.4 state machines; error handling, route registry (§4.1) and screen table; §7.1 variables; §7.2 replaces the planned deployment with the actual architecture and workflows; §7.3 and §8 describe the real layout, coverage gate and Git flow; §1.3 states where services use Prisma directly | Deliverable 2 update, checked against `backend/src`, `backend/prisma`, `.github/workflows` and `deploy/` (Issue #60) |

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
| Packaging | Multi-stage root `Dockerfile` (Node 22 serves API and built SPA); Docker Compose with `postgres`, `backend` and `frontend` (Nginx) services | Required for Lab 5 |

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
| Repositories (Prisma) | Reads and simple writes for sessions, users, menu and order queries | Contain rules |
| PostgreSQL | Durable data, relationships, constraints (CHECK, UNIQUE, FK) as the last line of defense | — |

**Implemented layering.** Order commands (create, accept, reject, cancel, pay, start, ready, complete) run inside `prisma.$transaction` in `orderService.ts`, which uses the transaction client directly; stock reservation is one raw SQL `UPDATE … RETURNING` there. Repositories serve the non-transactional queries.

The browser and API communicate only through JSON over HTTP. In development Vite proxies `/api` to the Express port, so the cookie is same-origin.

### 1.4 Where each rule is enforced
| Rule | Service | DB constraint | Notes |
|---|---|---|---|
| BR-01 quantity and line limits | Yes | CHECK `quantity BETWEEN 1 AND 10`; UNIQUE `(orderId, menuItemId)` | zod also rejects first |
| BR-02 availability | Yes (inside transaction) | — | Whole order rolls back on failure |
| BR-03 total | Yes (`calculateOrderTotal`) | — | Client fields rejected (DEC-07) |
| BR-04 price snapshot | Yes | `OrderItem.unitPriceSatang` stored | |
| BR-05 stock atomic | Conditional `updateMany` where `stockQty >= qty` | CHECK `stockQty >= 0` | Race-safe |
| BR-06 transitions | Yes (`assertTransition`) | Conditional update `where status = expected` | Blocks double accept, double cancel, accept/reject/cancel races |
| BR-07, BR-08 access | Role guard + ownership check | — | Never in the frontend only |
| BR-14 order number | Yes (format from id) | — | |
| BR-15 history | Yes, same transaction | — | Payment changes no order status and writes no history row (DEC-35) |
| BR-09 paid before preparing | Yes (`start`) | Conditional update also requires `paymentStatus = PAID` | |
| BR-10 customer cancel | Yes (ownership, state machine) | Conditional update on `PENDING` | Stock restored once. Operator path planned (F-12) |
| BR-11 payment | Yes (`assertPaymentAllowed`) | Conditional update on `ACCEPTED`, `UNPAID` and exact total | State is checked before amount (DEC-36) |
| BR-12 rejection reason | zod: trimmed, 5 to 200 characters | `OrderStatusHistory.note` has no length constraint | Stock restored in the same transaction |
| BR-13 catalog values | zod on `/api/menu-items` (upper bounds also, DEC-29) | CHECK `priceSatang > 0`, `stockQty >= 0` | |

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
        string note "nullable, rejection reason"
        datetime createdAt
    }
```

### 2.2 Entities, constraints and ownership
| Entity | Key constraints | Ownership / access |
|---|---|---|
| User | `email` unique, lowercased; `role` in (`CUSTOMER`, `OPERATOR`); `passwordHash` is a bcrypt hash | Never returned by the API except id, email, displayName, role |
| Session | `tokenHash` unique (SHA-256 of the random token); `expiresAt` = created + 8 hours; cascade delete with user | Internal only |
| MenuItem | `name` unique; CHECK `priceSatang > 0`; CHECK `stockQty >= 0` | Public read; Operator write (F-05) |
| Order | FK `customerId`; `status` enum: `PENDING, ACCEPTED, REJECTED, CANCELLED, PREPARING, READY, COMPLETED`; `paymentStatus` enum: `UNPAID, PAID, REFUNDED`; `totalSatang >= 0` | Owner = `customerId`. Customer sees own; Operator sees all |
| OrderItem | UNIQUE `(orderId, menuItemId)`; CHECK `quantity BETWEEN 1 AND 10`, `unitPriceSatang > 0`, `lineTotalSatang > 0`; price and name snapshot | Follows the order |
| OrderStatusHistory | Append-only; FK to order and actor | Follows the order |

Money is stored as integer satang. The UI formats it as THB (for example `6000` → `฿60.00`).

**Indexes:** `Session.userId`, `Order.customerId`, `OrderItem.menuItemId`, `OrderStatusHistory.orderId`, plus the unique indexes above. Deleting a user cascades to sessions; deleting an order cascades to its items and history.

**Planned:** F-13 adds a `LoginThrottle` table with migration `0003_login_throttle` (DEC-52). It does not exist yet.

### 2.3 Database setup, migrations and seed
- **Migrations:** two Prisma migrations in `backend/prisma/migrations`: `0001_init` (tables, enums, CHECK constraints written as raw SQL) and `0002_index_hygiene` (indexes). Sprint 2 and F-09 added no migration.
- **Commands:** `npm run db:migrate` (`prisma migrate deploy`), `npm run db:seed`, `npm run db:reset` (drop, migrate, seed — local and test only).
- **Seed (`backend/prisma/seed.ts`)** creates only synthetic data and is **create-only**: an upsert with an empty update, so an existing user (including the password hash) and an existing menu item are never changed.
- **Demo data switch:** `SEED_DEMO_DATA` (default on unless `NODE_ENV=production`). With it off, only `operator1` and the first four menu items are created. With it on, all the data below is created.
- `--with-perf-orders` (backend workspace only) tops the first customer up to 500 orders and creates or restocks the NFR-05 order-test item; this one upsert does update that item.

| Seed data | Values |
|---|---|
| Users | `customer1@campusbites.test`, `customer2@campusbites.test` (CUSTOMER); `operator1@campusbites.test`, `operator2@campusbites.test` (OPERATOR). Passwords come from `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD` in `.env`; never committed. |
| Menu (name, satang, stock) | Basil Pork Rice 6000/30; Green Curry with Rice 6500/25; Fried Rice with Egg 5500/30; Thai Iced Tea 3000/50; Mango Sticky Rice 8000/1; Chicken Sandwich 7000/0 (sold out); Pad Thai 6000/20 with `isAvailable = false` |

- **Tests** use a separate database `campusbites_test`; guards refuse a database name that does not end in `_test`.

### 2.4 State machines

Order status (`backend/src/services/orderStateMachine.ts`). Every pair not listed is rejected with `409 INVALID_TRANSITION`.

| From | To | Endpoint | Role | Side effects | Status |
|---|---|---|---|---|---|
| — | `PENDING` | `POST /api/orders` | Customer | Stock reserved; history | Released |
| `PENDING` | `ACCEPTED` | `…/accept` | Operator | History | Released |
| `PENDING` | `CANCELLED` | `…/cancel` | Customer (owner) | Stock restored; history | Released |
| `PENDING` | `REJECTED` | `…/reject` | Operator | Stock restored; history with `note` | Implemented, on staging |
| `ACCEPTED` | `PREPARING` | `…/start` | Operator | Requires `PAID`; history | Released |
| `PREPARING` | `READY` | `…/ready` | Operator | History | Released |
| `READY` | `COMPLETED` | `…/complete` | Operator | History | Released |
| `ACCEPTED` | `CANCELLED` | `…/operator-cancel` | Operator | Stock restored; `PAID` → `REFUNDED` | **Planned (F-12)**; rejected today |

Payment status: `UNPAID` → `PAID` through `…/pay` (owner, `ACCEPTED`, exact amount, once; released). `PAID` → `REFUNDED` is **planned** with F-12; no code writes `REFUNDED` today.


## 3. UI conventions

### 3.1 Screens and navigation
| Route | Screen | Roles | Sprint |
|---|---|---|---|
| `/login` | Login form | Anonymous | 1 |
| `/menu` | Menu with cart and order form | Anonymous (view); Customer (order) | 1 |
| `/orders` | My orders list | Customer | 1 |
| `/orders/:id` | Order detail with items, totals, history | Customer (own), Operator (any) | 1 |
| `/operator/orders` | Incoming orders table with status filter, payment badge, Accept, Reject (dialog) and fulfilment actions | Operator | 1, 2, 3 (F-09) |
| `/operator/menu` | Catalog management | Operator | 2 |
| `/operator/reports` | Sales summary (**planned, F-11**; the route does not exist yet) | Operator | 3 |

Header: shop name, links by role, display name and role badge, Logout button. After login: Customer goes to `/menu`, Operator goes to `/operator/orders`. A footer shows the running version (`VITE_GIT_SHA`, otherwise `GET /api/health`). `/` redirects to `/login`; unknown paths redirect to `/`.

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

NFR-09 is **not yet verified for all screens**: loading, empty and error states are tested for the Sprint 1 screens; the all-screens check is R-04 (planned). An unbroken 200-character pickup note still overflows on order detail (FND-01); the rejection reason there already wraps.

## 4. API conventions

| Topic | Convention |
|---|---|
| Base path | `/api` (no version prefix) |
| Format | JSON request and response, `Content-Type: application/json`; field names camelCase; timestamps ISO-8601 UTC |
| Auth | Cookie `cb_session`; no client-supplied user id or role anywhere |
| Success | `200` read/update, `201` create, `204` no content |
| Request validation | zod `.strict()` body schemas: unknown fields cause 400. The `status` query on `GET /api/orders` is checked; other query parameters are ignored today (strict query parsing is planned with F-10). Endpoints without a body schema (accept, cancel, start, ready, complete) ignore a body |
| Error shape | `{ "error": { "code": "STRING_CODE", "message": "human text", "details": { } } }` (`details` optional) |
| Safe errors | 500 returns `INTERNAL_ERROR` with a generic message; details go to server logs only |
| Lists | No pagination; at most 200 rows (`/orders/mine` newest first, `/orders` oldest first). Pagination is planned with F-10 (CHG-06) |

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Malformed JSON, schema violation, invalid id or enum |
| 401 | `UNAUTHENTICATED` | No valid session |
| 401 | `INVALID_CREDENTIALS` | Wrong email or password (login only) |
| 403 | `FORBIDDEN` | Wrong role or not the owner |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `ITEM_UNAVAILABLE` | Item disabled or stock too low |
| 409 | `INVALID_TRANSITION` | Status change not allowed |
| 429 | `TOO_MANY_ATTEMPTS` | Login throttled (**planned, F-13**; not returned today) |
| 500 | `INTERNAL_ERROR` | Unexpected failure |

`GET /api/ready` does not use the error shape: it answers `{ "status": "ready", "database": "ok" }` (200) or `{ "status": "unavailable", "database": "unreachable" }` (503), with `Cache-Control: no-store` and a 2-second database timeout. Two limits of the current handler (from reading `middleware/error.ts` and `app.ts`; no test covers them): body-parser errors other than malformed JSON (for example an oversized body) fall through to 500, and an unknown `/api` path gets the framework's default 404 page, not the JSON shape.

### Endpoint summary (detail is in the feature contracts)

Checked against `backend/src/routes/` at `dad286b`: 5 public and 14 protected routes, 19 mounted. "Released" means in `sprint-2-v2.0`.

| Method and path | Role | Feature | Sprint | Status |
|---|---|---|---|---|
| `GET /api/health` (returns `status`, `version`) | Anonymous | R-03 | 1 | Released |
| `GET /api/ready` | Anonymous | R-05 / Lab 5 | 2 | Released |
| `POST /api/auth/login` | Anonymous | F-01 | 1 | Released |
| `POST /api/auth/logout` | Anonymous or any | F-01 | 1 | Released |
| `GET /api/menu` | Anonymous | F-02 | 1 | Released |
| `GET /api/auth/me` | Customer, Operator | F-01 | 1 | Released |
| `POST /api/orders` | Customer | F-03 | 1 | Released |
| `GET /api/orders/mine` | Customer | F-03 | 1 | Released |
| `GET /api/orders/:id` | Customer (owner), Operator | F-03, F-04 | 1 | Released |
| `GET /api/orders` (`?status=`) | Operator | F-04 | 1 | Released |
| `POST /api/orders/:id/accept` | Operator | F-04 | 1 | Released |
| `POST /api/menu-items` | Operator | F-05 | 2 | Released |
| `PATCH /api/menu-items/:id` | Operator | F-05 | 2 | Released |
| `POST /api/orders/:id/cancel` | Customer (owner) | F-06 | 2 | Released |
| `POST /api/orders/:id/pay` | Customer (owner) | F-07 | 2 | Released |
| `POST /api/orders/:id/start` | Operator | F-08 | 2 | Released |
| `POST /api/orders/:id/ready` | Operator | F-08 | 2 | Released |
| `POST /api/orders/:id/complete` | Operator | F-08 | 2 | Released |
| `POST /api/orders/:id/reject` | Operator | F-09 | 3 | Implemented, on staging |
| `GET /api/orders/mine`, `GET /api/orders` with filter, search and pagination parameters (change) | Customer (own), Operator | F-10 | 3 | **Planned** |
| `GET /api/reports/sales` | Operator | F-11 | 3 | **Planned** |
| `POST /api/orders/:id/operator-cancel` | Operator | F-12 | 3 | **Planned** |
| `POST /api/auth/login` answers 429 when throttled (change) | Anonymous | F-13 | 3 | **Planned** |

### 4.1 Route registry
`backend/src/routes/registry.ts` lists every public route and every protected route with its roles (DEC-24, DEC-41). Routers take their guards from `guardsFor`, which throws at startup for an unregistered protected route. `mountRouter` accepts the application or a parent router and records every prefix, so `extractExpressRoutes` reports nested and twice-mounted routers. `findUnregisteredRoutes` must return nothing (TEST-43, TEST-90 to TEST-92).

## 5. Role and permission matrix

`Y` = allowed. `Own` = only records the user owns. `—` = rejected (401 if anonymous, 403 if logged in).

| Operation | Anonymous | Customer | Operator | Sprint |
|---|---|---|---|---|
| Log in | Y | Y | Y | 1 |
| Log out | Y (no-op) | Y | Y | 1 |
| Get current user | — (401) | Y | Y | 1 |
| View menu | Y | Y | Y | 1 |
| Health and readiness probes | Y | Y | Y | 1, 2 |
| Submit order | — | Y | — | 1 |
| List my orders | — | Own | — | 1 |
| View order detail | — | Own | Any | 1 |
| List all orders | — | — | Y | 1 |
| Accept order | — | — | Y | 1 |
| Create/edit/enable/disable menu item | — | — | Y | 2 |
| Cancel own `PENDING` order | — | Own, `PENDING` only | — | 2 |
| Cancel `ACCEPTED` order | — | — | Any `ACCEPTED` | Sprint 3 — planned |
| Pay order (simulated) | — | Own, `ACCEPTED` and `UNPAID` | — | 2 |
| Start / ready / complete | — | — | Y (start needs `PAID`) | 2 |
| Reject order | — | — | Any `PENDING` | 3 (implemented, on staging) |
| Sales summary | — | — | Y | Sprint 3 — planned |
| Search and filter orders | — | Own | Any (also by customer name) | Sprint 3 — planned |

A hidden button is not authorization. All implemented rows are enforced by backend middleware and services; the 14 protected routes are swept by TEST-43 and TEST-92. Rows marked planned are added to the same registry and tests in the PR that adds the endpoint. A role violation by a logged-in user is 403.

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
| Throttling | **Planned** (Sprint 3, F-13); there is no attempt limit today |

## 7. Configuration and delivery design

### 7.1 Environment variables
| Variable | Purpose | Example value in `.env.example` | Secret |
|---|---|---|---|
| `NODE_ENV` | `development`, `test`, `production` | `development` | No |
| `SEED_DEMO_DATA` | Seed demo users and fixture items (default off in production) | commented `false` | No |
| `RUN_MIGRATIONS` | Opt-in migrate and seed in the container entrypoint | commented `true` | No |
| `SERVE_STATIC`, `CLIENT_DIST_PATH` | Serve the built SPA outside production | commented | No |
| `APP_VERSION` / `GIT_SHA` | Version reported by `/api/health` (falls back to `1.0.0`); set by the image build and release script | — | No |
| `VITE_GIT_SHA` | Docker build argument for the footer version | — | No |
| `PORT` | API port | `3000` | No |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:postgres@localhost:5432/campusbites?schema=public` | Yes in production |
| `TEST_DATABASE_URL` | Test database; the name must end in `_test` | `postgresql://postgres:postgres@localhost:5432/campusbites_test?schema=public` | No (local) |
| `SESSION_TTL_HOURS` | Session lifetime | `8` | No |
| `COOKIE_SECURE` | Defaults to `true` in production; an explicit value wins | `false` | No |
| `BCRYPT_ROUNDS` | Hash cost | `10` | No |
| `CLIENT_ORIGIN` | Allowed browser origin; unset in production disables CORS | `http://localhost:5173` | No |
| `SEED_CUSTOMER_PASSWORD` | Demo customer password | `change-me-local` | Yes (do not reuse) |
| `SEED_OPERATOR_PASSWORD` | Demo operator password | `change-me-local` | Yes (do not reuse) |

Real values live only in a local `.env` (git-ignored) and, in production, in GCP Secret Manager. `.env.example` contains placeholders only. Safe test accounts are given to graders through the private course handoff. A Secret Manager value is not necessarily the stored password of an existing account (DEF-01). E2E and benchmark overrides are listed in `docs/labs/lab-05/deployment.md` §2.

### 7.2 Deployment architecture (delivered in Lab 5, extended by R-05)

```mermaid
flowchart LR
    GH[GitHub Actions: Deploy demo] -- build and push --> AR[Artifact Registry: toktickit]
    GH -- update and execute --> J[Cloud Run job toktickit-migrate]
    GH -- deploy by digest --> S[Cloud Run service toktickit]
    U[Browser] -- HTTPS --> S
    S --> DB[(Cloud SQL toktickit-pg, PostgreSQL 16)]
    J --> DB
    SM[Secret Manager] -. DATABASE_URL .-> S
    SM -. DATABASE_URL and seed passwords .-> J
```

| Concern | Implementation |
|---|---|
| Image | Root multi-stage `Dockerfile`; one Node 22 container serves `/api` and the built SPA, as user `node` |
| Service | Cloud Run `toktickit`, `asia-southeast1`, public. `deploy/deploy.sh` configures 0 to 3 instances, 512 MiB, 1 CPU (configured values; live settings are not re-checked here) |
| Migration and seed | Cloud Run job `toktickit-migrate` runs `prisma migrate deploy` then the create-only seed before the service is updated; a failure stops the release |
| Database | Cloud SQL `toktickit-pg` (the script uses tier `db-f1-micro`) |
| Secrets | Secret Manager: `toktickit-database-url`, `toktickit-admin-password`, `toktickit-demo-password` |
| Identity | Workload Identity Federation; no service-account key |
| `ci.yml` | Pull requests and pushes to `main`: coverage gate (all backend tests), frontend tests, Playwright; uploads `backend-coverage` |
| `ci-docker.yml` (`test-and-docker`) | Pull requests into `main`, `staging`, `lab5-staging`, `sprint-2-staging`; manual; and called by `deploy.yml`. Deploy-script tests, coverage gate, frontend tests and build, Docker build. **`sprint-3-staging` is not in its list yet** (DEC-57, planned). It runs no Playwright |
| `deploy.yml` (Deploy demo) | Push to `main`, or manual with `rollback` and `image_tag`: `test-and-docker`, image push, `deploy/release.sh`, `deploy/smoke_test.py` |
| Merge gate | `main` requires `test-and-docker` and one approval (`docs/labs/lab-05/deployment.md` §6) |
| Release identification | Git tag, and the short commit SHA in `GET /api/health` and the UI footer. Cloud checks: `deployment.md` §7 |

Persistence across restart and redeploy was checked on release `2f6cc46` (CHECK-01, `docs/evidence/CHECK-01-2f6cc46.txt`). F-09 is not deployed yet.

### 7.3 Repository layout
```
backend/    src/{config,controllers,db,middleware,repositories,routes,services,types}, prisma/, tests/, scripts/, benchmarks/
frontend/   src/{api,auth,components,lib,pages}, e2e/            (component tests sit beside the pages)
deploy/     deploy.sh, release.sh, smoke_test.py, teardown.sh, tests/
.github/    workflows/{ci,ci-docker,deploy}.yml
docs/       srs.md, system-sds.md, features.md, traceability.md, change-register.md, sprints/, labs/, evidence/
Dockerfile, docker-compose.yml, backend/.env.example, README.md
```

## 8. Test and workflow strategy

| Level | Tool | Used for |
|---|---|---|
| Unit | Vitest | Pure rules: total calculation, availability check, state machine, password helper |
| API + database integration | Vitest + Supertest on `campusbites_test` | Persistence, permissions, validation, concurrency, DB constraints |
| UI component | Vitest + React Testing Library | Empty, error and sold-out states |
| End-to-end | Playwright | Critical journeys: login, order, accept |

**Coverage gate (COV-01).** `npm run coverage --workspace=backend` measures line coverage of `backend/src/services` (test files excluded) and fails below 85% (NFR-10, DEC-40). It runs in `ci.yml` and in `test-and-docker`. Frontend coverage is not gated.

Backend unit and API tests and Playwright share `campusbites_test`, so they run one after another (DEC-26).

Git workflow: Issue → feature branch from the sprint staging branch (`sprint-1-staging`, `sprint-2-staging`, `sprint-3-staging`) → PR to staging with teammate review → staging checks → release PR to `main` → deploy → tag (`sprint-1-v1.0`, `sprint-2-v2.0`; planned `sprint-3-rc1`, `sprint-3-v3.0`). For each feature: contract first, failing tests (red), implementation (green); exceptions are disclosed in `docs/traceability.md` (retroactive red runs).
