# Omazon — Feature Inventory

| Item | Value |
|---|---|
| Document | `docs/features.md` |
| Version | 1.7 |
| Date | 2026-11-28 |
| Related | `docs/srs.md`, `docs/traceability.md`, `docs/sprints/plan.md`, `docs/sprints/sprint-1/features.md` (Sprint 1 contracts), `docs/sprints/sprint-2/features.md` (Sprint 2 contracts), `docs/sprints/sprint-3/features.md` (Sprint 3 contracts), `docs/change-register.md`, `docs/sprints/sprint-3/release-readiness.md` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial inventory | Deliverable 1 |
| 1.1 | 2026-11-05 | BR-02 split between F-02 (defines) and F-03 (enforces, AC-11/AC-21/AC-22); R-04 states the full NFR-05 load-test parameters; coverage wording defers verification gaps to traceability §5; approved-changes cross-reference corrected to §6 | Audit corrections: remove the BR-02 ambiguity and make NFR-05 verifiable |
| 1.2 | 2026-11-05 | Removed BR-13 from F-03: order submission does not enforce the catalog price/stock bounds, which belong to F-05 API validation and the R-03 DB checks | Align F-03 with the traceability matrix; F-03 enforces BR-02 and BR-05, not BR-13 |
| 1.3 | 2026-11-07 | Document title uses the Omazon display name | Display brand rename (DEC-25); no requirement, feature or sprint content changed |
| 1.4 | 2026-11-12 | §4 approved scope changes now lists CHG-01 and CHG-02 instead of "None yet" | The cell contradicted `docs/traceability.md` §6, which already records both changes (PR #20 review) |
| 1.5 | 2026-11-27 | Related row references the Sprint 2 contract file `docs/sprints/sprint-2/features.md` (F-05 to F-08, R-05); no requirement, feature or sprint content changed | Sprint 2 contracts written before implementation (Issue #53) |
| 1.6 | 2026-11-28 | Related row references the Sprint 3 contract file `docs/sprints/sprint-3/features.md` (F-09 to F-13, R-04); no requirement, feature or sprint content changed | Sprint 3 contracts written before implementation (Issue #59) |
| 1.7 | 2026-11-28 | New Status column for every feature and responsibility with the status definitions; §3 summary by sprint shows status; §4 lists CHG-01 to CHG-06. No requirement, description or sprint allocation changed | Deliverable 2 status update at `dad286b` (Issue #60) |

Status values (as of 2026-11-28): **planned** (contract only, no implementation), **in progress**, **implemented** (code present, verification not complete), **tested** (planned tests executed and passing, not yet in an accepted release), **accepted** (in an accepted release on `main`).

## 1. Features

| ID | Feature | Description | Requirements | Depends on | Sprint | Status |
|---|---|---|---|---|---|---|
| F-01 | Authentication and session | Login with email and password, logout, current-user identity, bcrypt password hashing, server-side session with 8-hour expiry. Login and role-based landing page in the UI. | FR-01, FR-02, FR-03, NFR-03, NFR-04 | R-03 | 1 | accepted (Sprint 1, `sprint-1-v1.0`) |
| F-02 | Menu browsing | Public menu API and screen showing name, description, THB price and availability. Defines the availability rule `isOrderable`. Seeded catalog. | FR-04, BR-02 (defines the rule; F-03 enforces it, AC-11/AC-21/AC-22), NFR-09 (partial) | R-03 | 1 | accepted (Sprint 1, `sprint-1-v1.0`) |
| F-03 | Order submission and customer order views | Customer builds a cart and submits an order. Server validates quantities and availability, calculates the total, snapshots prices, reserves stock atomically and records history. Customer views order detail and "My orders". | FR-05, FR-06, FR-07, BR-01, BR-02 (enforces the rule defined in F-02; AC-11/AC-21/AC-22), BR-03, BR-04, BR-05, BR-07, BR-14, BR-15, NFR-09 (partial) | F-01, F-02, R-01, R-02 | 1 | accepted (Sprint 1, `sprint-1-v1.0`) |
| F-04 | Operator order list and acceptance | Operator lists incoming orders (oldest first, status filter), views any order, and accepts a `PENDING` order. Status machine and history entry. | FR-08, FR-09, BR-06, BR-07, BR-08, BR-15 | F-01, F-03, R-01 | 1 | accepted (Sprint 1, `sprint-1-v1.0`) |
| F-05 | Catalog management | Operator creates and edits menu items, price, stock, enable/disable. Price and stock validation. | FR-10, BR-13, BR-04 | F-01, F-02, R-01 | 2 | accepted (`sprint-2-v2.0`) |
| F-06 | Customer order cancellation | Customer cancels own `PENDING` order; stock restored; history recorded. | FR-11, BR-10, BR-06 | F-03 | 2 | accepted (`sprint-2-v2.0`) |
| F-07 | Simulated payment | Customer pays an `ACCEPTED`, `UNPAID` order. Amount must equal the total. Payment status becomes `PAID`. | FR-13, BR-11 | F-04 | 2 | accepted (`sprint-2-v2.0`) |
| F-08 | Fulfilment workflow | Operator moves a paid order `ACCEPTED` → `PREPARING` → `READY` → `COMPLETED`. Customer sees the progress. | FR-12, BR-06, BR-09 | F-04, F-07 | 2 | accepted (`sprint-2-v2.0`) |
| F-09 | Order rejection with reason | Operator rejects a `PENDING` order with a 5–200 character reason; stock restored; the customer sees the reason. | FR-14, BR-12, BR-06 | F-04 | 3 | tested (on `sprint-3-staging`, `15ea606`; not released to `main`) |
| F-10 | Order search and filter | Filter by status and date range, search by order number (customers: own orders; operators: all orders and customer name). Pagination. | FR-15 | F-03, F-04 | 3 | planned |
| F-11 | Sales summary report | Operator sees total sales, order count per status and top items for a date range. | FR-16 | F-08 | 3 | planned |
| F-12 | Operator cancellation and refund | Operator cancels an `ACCEPTED` order before preparation; stock restored; paid order becomes `REFUNDED` (simulated). | FR-17, BR-06 | F-07, F-08 | 3 | planned |
| F-13 | Login throttling | After 5 failed logins per email within 15 minutes, further attempts return 429 for 15 minutes. | NFR-11 | F-01 | 3 | planned |

## 2. System responsibilities (cross-cutting)

| ID | Responsibility | Description | Requirements | Established / verified | Status |
|---|---|---|---|---|---|
| R-01 | Access control | Authentication middleware (valid session required) and role guard on every protected route; ownership checks in services. Every new endpoint is added to the route-table test. | NFR-01, NFR-02, BR-07, BR-08 | Established and verified in Sprint 1 (AC-43); extended in Sprints 2 and 3 | accepted (`sprint-2-v2.0`); F-09 route extension tested; F-11 and F-12 extensions planned |
| R-02 | Validation and error handling | Strict request schemas (zod), one error response shape, no stack traces or SQL in responses. | NFR-07 | Sprint 1 (AC-44) | accepted (Sprint 1, `sprint-1-v1.0`) |
| R-03 | Setup, migrations and seed | Prisma migrations, repeatable seed with synthetic users and menu, README, `.env.example`, DB CHECK constraints. | NFR-08, BR-13 (DB check) | Sprint 1 (AC-45, AC-46) | accepted (Sprint 1, `sprint-1-v1.0`) |
| R-04 | Performance and final usability | Load test of `GET /api/menu` and `POST /api/orders`: p95 ≤ 500 ms and zero 5xx at 20 concurrent connections for 30 s per endpoint, on a database seeded with 500 orders and an order-test item with enough stock for the whole run; autocannon raw output and tested commit kept as evidence. Loading/empty/error states on all screens. | NFR-05, NFR-09 | Sprint 3 | planned |
| R-05 | Delivery and quality gates | Docker, CI (build, test, coverage on PRs), GCP deployment from `main`, durable database. | NFR-06, NFR-10 | Lab 5 and Sprint 2 | accepted (`sprint-2-v2.0`) |

## 3. Feature summary by sprint

| Sprint | Features | Responsibilities | Status (2026-11-28) |
|---|---|---|---|
| 1 | F-01, F-02, F-03, F-04 | R-01, R-02, R-03 | All accepted (`sprint-1-v1.0`) |
| 2 | F-05, F-06, F-07, F-08 | R-01 (extended), R-05 | All accepted (`sprint-2-v2.0`) |
| 3 | F-09, F-10, F-11, F-12, F-13 | R-01 (extended), R-04 | F-09 tested on staging; F-10, F-11, F-12, F-13 and R-04 planned |

## 4. Coverage check

| Check | Result |
|---|---|
| FR-01 to FR-17 each map to at least one feature | Yes |
| BR-01 to BR-15 each map to at least one feature | Yes |
| NFR-01 to NFR-11 each map to a feature or responsibility | Yes |
| Uncovered requirements | No requirement lacks a feature; verification gaps are listed in traceability §5. |
| Approved changes | CHG-01 to CHG-06, in `docs/traceability.md` §6 and `docs/change-register.md` |
