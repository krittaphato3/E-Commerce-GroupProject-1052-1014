# CampusBites — Sprint 1 Features: Engineering Contracts

| Item | Value |
|---|---|
| Document | `docs/sprints/sprint-1/features.md` |
| Sprint | 1 (due with Deliverable 1, 8 Nov 2026) |
| Staging branch | `sprint-1-staging` |
| Release tag (planned) | `sprint-1-v1.0` |
| Version | 1.6 |
| Date | 2026-11-07 |
| Related | `docs/srs.md`, `docs/features.md` (whole-product inventory), `docs/traceability.md`, `docs/sprints/plan.md`, `docs/system-sds.md` |

## Revision history (contract set)
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contracts F-01 to F-04 and cross-cutting R-01 to R-03 | Written before implementation |
| 1.1 | 2026-11-05 | AC-25/TEST-25 and AC-34/TEST-34 assert the history `createdAt`; F-02 and F-03 contract index and headers state BR-02 ownership; F-01 `Max-Age` derived from `SESSION_TTL_HOURS`; heading levels normalised (no H2 → H4 jumps) | Audit corrections: cover BR-15's timestamp clause and remove traceability and formatting defects |
| 1.2 | 2026-11-05 | F-01, F-02, F-03 and F-04 each gained a "Failure and boundary cases" subsection summarising the failure and boundary behavior already defined by their AC and STS rows | Deliverable 1 §3.5 lists failure/boundary cases as part of the feature design |
| 1.3 | 2026-11-05 | F-01 Failure and boundary cases: clarified wrong-password vs unknown-email cookie behavior; clarified logout session invalidation and 204 return | Precision fix aligning failure and boundary statements with AC-02, AC-03, and AC-06 |
| 1.4 | 2026-11-06 | F-01 Validation: login `password` limit changed from 128 characters to 72 bytes (`Buffer.byteLength`) | Match bcrypt's 72-byte input limit so passwords beyond 72 UTF-8 bytes are not silently truncated (DEC-18) |
| 1.5 | 2026-11-06 | F-02 API: `GET /api/menu` also returns `isAvailable` alongside the computed `available` flag | ISSUE-4 technical specification lists `isAvailable` in the payload; the field is the stored flag, so the client never has to infer it |
| 1.6 | 2026-11-07 | F-04 Contract revision: AC-42 / TEST-42 asserts in-place 403 Forbidden alert rather than redirect per DEC-23 (Option A); F-03 POST /api/orders adds `Location: /api/orders/:id` header (Follow-up 3); Menu UI caps quantity at Math.min(10, stockQty) (Follow-up 5) | Feature F-04 implementation alignment and follow-up defect resolutions |

Each contract below keeps its own revision history. Log every change there with a reason; do not rewrite earlier entries.

## 1. Contract index

| Section | Feature | AC / tests | Requirements |
|---|---|---|---|
| 7 | F-01 Authentication and session | AC-01 to AC-09 | FR-01, FR-02, FR-03, NFR-03, NFR-04 |
| 8 | F-02 Menu browsing | AC-10 to AC-13 | FR-04, BR-02 (defines the rule), NFR-09 |
| 9 | F-03 Order submission and customer views | AC-14 to AC-31 | FR-05, FR-06, FR-07, BR-01 to BR-05 (BR-02 enforced here; rule defined in F-02), BR-07, BR-14, BR-15 |
| 10 | F-04 Operator list and acceptance | AC-32 to AC-42 | FR-08, FR-09, BR-06 to BR-08, BR-15 |
| 11 | R-01, R-02, R-03 Cross-cutting | AC-43 to AC-46 | NFR-01, NFR-02, NFR-07, NFR-08, BR-13 (DB) |

Total: **46 acceptance criteria, 46 tests** (TEST-nn verifies AC-nn).


---

## 2. Product Definition of Done (applies to every feature)

A feature is **done** only when all items are true and the evidence is retained:

1. Required behavior is implemented as described in the feature contract, and its AC are met.
2. Every planned test for the feature has been **executed**; the command, tested commit, counts (pass / fail / skipped) and output are saved.
3. Assertions are meaningful. No required test is skipped, disabled, mocked-away or weakened. Any failed or skipped test is disclosed.
4. For each meaningful rule, a test was seen **failing first** (red) and then passing (green); both commit IDs are recorded.
5. The work is on a feature branch created from `sprint-1-staging`, in a PR reviewed by the teammate with a specific comment. The author does not approve their own PR.
6. Integration tests and acceptance checks pass on `sprint-1-staging`. The reviewed release PR from staging to `main` is merged and tagged.
7. Documents are current: contract revisions are logged with reasons, `README.md`, `.env.example`, migrations and seed match the code.
8. No real secrets or personal data are in Git or in the PDF. Demo data is synthetic.
9. Incomplete work, known defects and limitations are listed in Part F of the PDF.
10. Completion is shown by test output and screenshots that you produced by running the product, not by an AI agent's statement.

---

## 3. Test-level summary

| Level | Count | Tests |
|---|---|---|
| Unit | 1 | TEST-11 |
| Unit + API/database integration | 4 | TEST-08, 15, 18, 35 |
| API + database integration | 33 | TEST-01 to 07, 10, 14, 16, 17, 19 to 28, 32 to 34, 36 to 40, 43 to 46 (TEST-45 also has a manual fresh-clone check) |
| UI component | 3 | TEST-13, 30, 31 |
| End-to-end (Playwright) | 5 | TEST-09, 12, 29, 41, 42 |
| **Total** | **46** | |

---

## 4. Planned Issues and branches

| Issue | Feature | Branch | Reviewer |
|---|---|---|---|
| ISSUE-1 | R-03 Setup, schema, seed | `feature/R-03-setup-seed` | Teammate |
| ISSUE-2 | F-01 Authentication | `feature/F-01-authentication` | Teammate |
| ISSUE-3 | R-01, R-02 Access control and errors | `feature/R-01-R-02-access-errors` | Teammate |
| ISSUE-4 | F-02 Menu | `feature/F-02-menu-browsing` | Teammate |
| ISSUE-5 | F-03 Order submission | `feature/F-03-order-submission` | Teammate |
| ISSUE-6 | F-04 Operator acceptance | `feature/F-04-operator-acceptance` | Teammate |

Pair the work so that both students author at least two Issues and review the others; record who authored and who reviewed in each PR.

---

## 5. Commit sequence to keep for evidence

For each feature, make these commits in order and keep the hashes:

1. `docs(F-xx): contract, AC and STS` (specification only)
2. `test(F-xx): failing tests for AC-.. (red)` — run and save the failing output
3. `feat(F-xx): implementation (green)` — run and save the passing output
4. `docs(F-xx): contract revision` (only if the contract changed, with the reason)

---

## 6. Evidence to collect for Part F of the PDF

| Evidence | From | Maps to |
|---|---|---|
| Normal journey screenshots: login, menu, order submitted, order detail, operator accept, customer sees `ACCEPTED`, plus API or DB retrieval | AC-29, AC-34, AC-41 | Part F demo 1 |
| Rule rejection screenshot: unavailable item (409) and invalid quantity (400) | AC-18, AC-21 | Part F demo 2 |
| Login, logout, then old session rejected (401) | AC-06, AC-09 | Part F demo 3 |
| Forbidden operations from API tests: customer accepts order (403), customer reads another customer's order (403), anonymous order (401) | AC-26, AC-27, AC-37 | Part F demo 3 |
| Full test command and output with counts and the tested commit hash | all | Build and test results |
| AC → TEST → actual test file::name → result table | `docs/traceability.md` | Results table |
| Two test excerpts: domain rule (AC-24 concurrent last unit) and access restriction (AC-27) | tests | Test excerpts |
| TDD red then green output for AC-24 and AC-34 with commit IDs | git history | TDD evidence |
| Two Issue and PR chains (for example ISSUE-5 and ISSUE-6) with branch, author, reviewer, review comment, staging merge, release merge | GitHub | Workflow evidence |
| Commit history showing contracts before implementation | `git log` | History evidence |
| Contribution table, AI-use declaration, known limitations | team | Part F |

---

## 7. F-01 — Authentication and Session (Engineering Contract)

| Item | Value |
|---|---|
| Feature | F-01 Authentication and session |
| Requirements | FR-01, FR-02, FR-03, NFR-03, NFR-04 (also supports NFR-01, NFR-07) |
| Sprint | 1 |
| Depends on | R-03 (schema and seed) |
| Contract version | 1.4 (2026-11-06) |
| Issue / branch | ISSUE-2 / `feature/F-01-authentication` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contract | Before implementation |
| 1.1 | 2026-11-05 | API spec notes that `Max-Age` is derived from `SESSION_TTL_HOURS` (default 8 h) | Reconcile the cookie lifetime with the configurable session TTL |
| 1.2 | 2026-11-05 | Added a Failure and boundary cases subsection citing AC-02 to AC-09 | Document failure and boundary behavior already defined by the AC and STS |
| 1.3 | 2026-11-05 | Clarified failure and boundary cases: both wrong password and unknown email return 401 with identical message, wrong password sets no cookie; logout invalidates cookie and returns 204 | Match AC-02, AC-03, and AC-06 assertions exactly without claiming no-cookie for unknown email or 204 without session |
| 1.4 | 2026-11-06 | Validation: login `password` maximum changed from 128 characters to 72 bytes (`Buffer.byteLength`) | bcrypt only hashes the first 72 UTF-8 bytes (DEC-18) |

### 1. Feature design

**Behavior.** A seeded user logs in with email and password. The server verifies the bcrypt hash, creates a session valid for 8 hours and sends an httpOnly cookie. The user can ask who they are (`/me`) and log out. Logout deletes the session so the cookie stops working immediately.

**Workflow.**
1. User opens `/login` and submits email and password.
2. `POST /api/auth/login` validates the body, finds the user, compares the hash.
3. On success: create `Session`, set `cb_session` cookie, return the user. UI redirects by role.
4. Later requests carry the cookie; middleware loads the user (`GET /api/auth/me`).
5. Logout: `POST /api/auth/logout` deletes the session and clears the cookie.

**Business and security rules.** NFR-03 (bcrypt hash, never returned), NFR-04 (8-hour expiry, logout invalidates immediately), FR-01 (same error for unknown email and wrong password). The role always comes from the database.

**Validation.** `email`: string, valid email format, max 254. `password`: string, 1 to 72 bytes. Unknown fields are rejected.

**Dependencies.** `User` and `Session` tables, seeded accounts.

**Permissions.** Login: anyone. Logout: anyone (no-op if no session). `/me`: authenticated users.

**Failure and boundary cases.**
- Both a wrong password and an unknown email return 401 `INVALID_CREDENTIALS` with the same message (AC-02, AC-03), and the wrong-password case also sets no cookie (AC-02).
- A missing field, wrong type, malformed email, over-length value or unknown field returns 400 `VALIDATION_ERROR` in the standard error shape (AC-04).
- A missing, unknown, expired or logged-out session cookie returns 401 `UNAUTHENTICATED` with no user data (AC-05, AC-06, AC-07).
- Expiry boundary: the created session's `expiresAt` is 8 hours ahead within a one-minute tolerance (AC-01), and a session whose `expiresAt` has passed is rejected (AC-07).
- Logout invalidates the session cookie and returns 204 (AC-06), and `passwordHash` never appears in any response (AC-08).
- In the UI an invalid login shows the generic error, and a protected page visited after logout redirects to `/login` (AC-09).

### 2. API specification

#### `POST /api/auth/login`
| Item | Spec |
|---|---|
| Request | `{ "email": "customer1@campusbites.test", "password": "<password>" }` |
| 200 | `{ "user": { "id": 1, "email": "...", "displayName": "...", "role": "CUSTOMER" } }` and `Set-Cookie: cb_session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800` (`Max-Age` = `SESSION_TTL_HOURS` × 3600, default 8 h) |
| 400 | `VALIDATION_ERROR` (missing, wrong type, malformed email, unknown field) |
| 401 | `INVALID_CREDENTIALS`, message "Invalid email or password." (identical for unknown email and wrong password). No cookie set |

#### `POST /api/auth/logout`
| Item | Spec |
|---|---|
| Request | no body |
| 204 | Session row deleted (if present) and cookie cleared. Safe to call without a session |

#### `GET /api/auth/me`
| Item | Spec |
|---|---|
| 200 | `{ "user": { "id", "email", "displayName", "role" } }` |
| 401 | `UNAUTHENTICATED` when the cookie is missing, unknown, expired or logged out. Body contains no user data |

### 3. UI specification
| Element | Behavior |
|---|---|
| `/login` page | Email and password inputs, "Log in" button, error alert area |
| Loading | Button disabled and shows "Logging in…" while the request is pending |
| Error | Shows "Invalid email or password." on 401; field messages on 400 |
| Success | Customer redirects to `/menu`; Operator redirects to `/operator/orders` |
| Header | Shows display name, role badge and a Logout button when logged in |
| Logout | Calls the API, clears local user state, redirects to `/login` |
| Route guard | Visiting a protected page when not logged in redirects to `/login` (navigation only) |

### 4. Data specification
| Table | Change |
|---|---|
| `User` | Create in migration `0001_init` (seeded in R-03) |
| `Session` | Create in migration `0001_init`: `tokenHash` unique, `expiresAt`, `userId` FK with cascade |
| Others | No change |

### 5. Acceptance criteria

| AC | Statement |
|---|---|
| AC-01 | Valid email and password returns 200 with the user (id, email, displayName, role), sets the `cb_session` cookie with `HttpOnly` and `SameSite=Lax`, and creates one `Session` row with `expiresAt` about 8 hours ahead. |
| AC-02 | A correct email with a wrong password returns 401 `INVALID_CREDENTIALS` and sets no cookie. |
| AC-03 | An unknown email returns 401 `INVALID_CREDENTIALS` with exactly the same message and status as AC-02. |
| AC-04 | A missing field, wrong type, malformed email, over-length value or unknown field returns 400 `VALIDATION_ERROR` in the standard error shape. |
| AC-05 | `GET /api/auth/me` with a valid session returns that user's identity; without a session it returns 401 with no user data. |
| AC-06 | After `POST /api/auth/logout`, the same cookie sent to `GET /api/auth/me` returns 401 and the `Session` row no longer exists. |
| AC-07 | A session whose `expiresAt` is in the past is rejected with 401 on `GET /api/auth/me`. |
| AC-08 | `User.passwordHash` in the database is a bcrypt hash (starts with `$2`) and is not equal to the plaintext password; no API response contains `passwordHash`. |
| AC-09 | In the UI, a valid login redirects by role, an invalid login shows the error, and after Logout a protected page redirects to `/login`. |

### 6. Software Test Specification (STS)

| Test | AC | Level | Precondition and input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-01 | AC-01 | Integration | Seeded `customer1` | POST `/api/auth/login` with correct credentials | 200; body user has role `CUSTOMER` and no `passwordHash`; `Set-Cookie` contains `cb_session`, `HttpOnly`, `SameSite=Lax`; one `Session` row exists with `expiresAt` between 7h59m and 8h01m ahead |
| TEST-02 | AC-02 | Integration | Seeded `customer1` | POST login with wrong password | 401, code `INVALID_CREDENTIALS`; no `Set-Cookie`; no new `Session` row |
| TEST-03 | AC-03 | Integration | No user `nobody@campusbites.test` | POST login with that email | 401, code and message identical to TEST-02 response |
| TEST-04 | AC-04 | Integration | None | POST login with: empty body; `email` missing; `password` number; `email: "abc"`; extra field `role` | Each returns 400, code `VALIDATION_ERROR`, error shape `{error:{code,message}}` |
| TEST-05 | AC-05 | Integration | Logged-in `operator1` | GET `/api/auth/me` with cookie, then without cookie | With cookie: 200 and role `OPERATOR`. Without: 401 `UNAUTHENTICATED` and body has no `user` |
| TEST-06 | AC-06 | Integration | Logged-in `customer1`, cookie saved | POST logout; then GET `/api/auth/me` with the saved cookie | Logout 204; `/me` returns 401; `Session` count for the user is 0 |
| TEST-07 | AC-07 | Integration | Session row with `expiresAt` set to 1 minute in the past | GET `/api/auth/me` with its token | 401 `UNAUTHENTICATED` |
| TEST-08 | AC-08 | Unit + Integration | Seeded users | Unit: hash helper output starts with `$2` and verifies; Integration: read `User.passwordHash` from DB; inspect login and `/me` response bodies | Hash is not the plaintext and starts with `$2`; no response contains `passwordHash` |
| TEST-09 | AC-09 | End-to-end | Seeded customer and operator | Playwright: log in as customer; log out; open `/orders`; log in with wrong password; log in as operator | Customer lands on `/menu`; after logout `/orders` redirects to `/login`; wrong password shows "Invalid email or password."; operator lands on `/operator/orders` |

Planned test files: `backend/tests/auth.test.ts`, `backend/src/services/password.test.ts`, `frontend/e2e/auth.spec.ts`.

### 7. Definition of Done (feature-specific)
In addition to the Product Definition of Done (section 2 of this document):
- TEST-01 to TEST-09 executed and passing, results recorded.
- Red-then-green evidence kept for TEST-06 (logout invalidates the session).
- Screenshots: login success, login failure, logged-in header, old session rejected after logout (API output).
- Seed passwords come from `.env`; no password appears in the repository or the PDF.

---

## 8. F-02 — Menu Browsing (Engineering Contract)

| Item | Value |
|---|---|
| Feature | F-02 Menu browsing |
| Requirements | FR-04, BR-02 (defines the availability rule; F-03 enforces it, AC-11/AC-21/AC-22), NFR-09 (partial) |
| Sprint | 1 |
| Depends on | R-03 (schema and seed) |
| Contract version | 1.3 (2026-11-06) |
| Issue / branch | ISSUE-4 / `feature/F-02-menu-browsing` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contract | Before implementation |
| 1.1 | 2026-11-05 | Contract index and header state that F-02 defines BR-02 and F-03 enforces it (AC-11/AC-21/AC-22) | Remove the BR-02 ownership ambiguity |
| 1.2 | 2026-11-05 | Added a Failure and boundary cases subsection citing AC-11 to AC-13 | Document failure and boundary behavior already defined by the AC and STS |
| 1.3 | 2026-11-06 | API response also includes `isAvailable` next to the computed `available` flag | ISSUE-4 technical specification requires the stored flag in the payload; AC-10 still guarantees every listed field and no `createdAt` |

### 1. Feature design

**Behavior.** Anyone can open the menu and see each item's name, description, price and whether it can be ordered now. An item is **available** when `isAvailable = true` and `stockQty > 0`. The cart and order form are added to this page by F-03.

**Workflow.** Page loads → `GET /api/menu` → items are shown as cards in database order by `id`.

**Rules.** `available = isAvailable AND stockQty > 0`. This is computed by one shared function `isOrderable(item, quantity)` that F-03 reuses (`isOrderable(item, 1)` for the flag, `isOrderable(item, n)` for an order line). Money is returned as integer satang.

**Validation.** No input.

**Permissions.** Public. No private data is returned.

**Failure and boundary cases.**
- Stock 0 and `isAvailable = false` are the availability boundaries: both report `available: false` and render as sold out with a disabled add button (AC-11, AC-12).
- An empty catalog shows "The menu is empty." rather than a blank page (AC-13).
- A failed menu request shows an error message with a Retry button, and a pending request shows "Loading menu…" (AC-13).

### 2. API specification

#### `GET /api/menu`
| Item | Spec |
|---|---|
| 200 | `{ "items": [ { "id": 1, "name": "Basil Pork Rice", "description": "...", "priceSatang": 6000, "stockQty": 30, "isAvailable": true, "available": true } ] }` ordered by `id` ascending. `available = isAvailable AND stockQty > 0` |
| Notes | No `createdAt`, no internal fields. Works with or without a session |
| Errors | 500 `INTERNAL_ERROR` generic on failure |

### 3. UI specification
| Element | Behavior |
|---|---|
| Menu page `/menu` | Grid of item cards: name, description, price formatted as `฿60.00`, stock hint ("12 left" when stock is 10 or less) |
| Sold out | Item with `available = false` shows a "Sold out" badge and its add button is disabled |
| Loading | "Loading menu…" while the request is pending |
| Empty | "The menu is empty." when `items` is an empty list |
| Error | Alert "Could not load the menu. Please try again." with a Retry button |

### 4. Data specification
| Table | Change |
|---|---|
| `MenuItem` | Create in migration `0001_init` with `priceSatang` CHECK `> 0` and `stockQty` CHECK `>= 0` (see R-03) |
| Seed | 7 items (see System SDS section 2.3), including one with stock 0 and one with `isAvailable = false` |

### 5. Acceptance criteria

| AC | Statement |
|---|---|
| AC-10 | An anonymous `GET /api/menu` returns 200 with all seeded items, each with `id`, `name`, `description`, `priceSatang` (integer), `stockQty` and `available`, ordered by `id`. |
| AC-11 | `available` is `false` when `isAvailable` is false or `stockQty` is 0, and `true` only when both `isAvailable` is true and `stockQty` is above 0. |
| AC-12 | The menu screen shows prices formatted as THB (for example `฿60.00`) and shows sold-out items with a "Sold out" badge and a disabled add button. |
| AC-13 | The menu screen shows an empty-state message for an empty list, a loading message while loading, and an error message with Retry when the request fails. |

### 6. Software Test Specification (STS)

| Test | AC | Level | Precondition and input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-10 | AC-10 | Integration | Seeded database, no cookie | GET `/api/menu` | 200; 7 items; every `priceSatang` is an integer; items sorted by `id`; no `createdAt` field; response contains no user data |
| TEST-11 | AC-11 | Unit | Items: (enabled, stock 5), (enabled, stock 0), (disabled, stock 5), (disabled, stock 0) | Call `isOrderable(item, 1)` for each; also `isOrderable(enabled stock 5, 6)` | `true`, `false`, `false`, `false`; the quantity-6 call returns `false` |
| TEST-12 | AC-12 | End-to-end | Seeded database | Playwright opens `/menu` without logging in | "Basil Pork Rice" shows `฿60.00`; "Chicken Sandwich" has "Sold out" and a disabled button; "Pad Thai" is shown as sold out |
| TEST-13 | AC-13 | UI component | API client mocked to return: pending, `{items: []}`, network error | Render the menu component in each state | "Loading menu…"; "The menu is empty."; error message and a Retry button that calls the API again |

Planned test files: `backend/tests/menu.test.ts`, `backend/src/services/menuRules.test.ts`, `frontend/src/pages/Menu.test.tsx`, `frontend/e2e/menu.spec.ts`.

### 7. Definition of Done (feature-specific)
In addition to the Product Definition of Done:
- TEST-10 to TEST-13 executed and passing, results recorded.
- Screenshot of the menu with a sold-out item and the formatted price.
- `isOrderable` is exported and used by F-03 (no duplicate availability logic).

---

## 9. F-03 — Order Submission and Customer Order Views (Engineering Contract)

| Item | Value |
|---|---|
| Feature | F-03 Order submission and customer order views |
| Requirements | FR-05, FR-06, FR-07, BR-01, BR-02 (enforces the rule defined in F-02; AC-11/AC-21/AC-22), BR-03, BR-04, BR-05, BR-07, BR-14, BR-15, NFR-09 (partial) |
| Sprint | 1 |
| Depends on | F-01, F-02, R-01, R-02 |
| Contract version | 1.3 (2026-11-07) |
| Issue / branch | ISSUE-5 / `feature/F-03-order-submission` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contract | Before implementation |
| 1.1 | 2026-11-05 | Header states BR-02 enforcement; AC-25 and TEST-25 assert the order-creation history `createdAt` | Cover BR-15's timestamp clause and clarify requirement ownership |
| 1.2 | 2026-11-05 | Added a Failure and boundary cases subsection citing AC-16, AC-18 to AC-22, AC-24, AC-26 to AC-28, AC-30 and AC-31 | Document failure and boundary behavior already defined by the AC and STS |
| 1.3 | 2026-11-07 | POST /api/orders sets Location header /api/orders/:id on 201 response (Follow-up 3); Menu cart UI caps selectable and cart line quantities at Math.min(10, stockQty) while retaining 409 ITEM_UNAVAILABLE backend safety net (Follow-up 5) | Follow-up defect resolutions identified prior to branch 5 |

### 1. Feature design

**Behavior.** A logged-in Customer builds a cart on the menu page and submits it. The server validates the request, checks availability, reserves stock, calculates the total from database prices, saves the order as `PENDING` / `UNPAID`, and records a history entry. The Customer can then open the order and list all their own orders.

**Workflow (`POST /api/orders`).**
1. Authenticate (401) and require role `CUSTOMER` (403).
2. Validate the body with a strict schema (400).
3. Check every `menuItemId` exists (400 if not).
4. Start one database transaction:
   1. Process lines in ascending `menuItemId` (avoids deadlocks).
   2. For each line run one atomic statement: `UPDATE "MenuItem" SET "stockQty" = "stockQty" - :qty WHERE id = :id AND "isAvailable" = true AND "stockQty" >= :qty RETURNING name, "priceSatang"`. Zero rows means 409 `ITEM_UNAVAILABLE` and the whole transaction rolls back (BR-02, BR-05).
   3. Build lines with the returned name and price (BR-04) and compute `lineTotal = price × qty`.
   4. `total = calculateOrderTotal(lines)` (BR-03).
   5. Insert `Order` (`PENDING`, `UNPAID`, `customerId` from the session), `OrderItem` rows, and one `OrderStatusHistory` row (`fromStatus` null → `PENDING`, actor = customer) (BR-15).
5. Commit and return 201 with header `Location: /api/orders/:id`.

**Business rules.** BR-01 (quantity 1–10, 1–10 lines, no duplicate item), BR-02, BR-03, BR-04, BR-05, BR-07, BR-14 (order number `CB-` + id padded to 6 digits, computed when building the response), BR-15.

**Validation (zod, strict).**
| Field | Rule |
|---|---|
| `items` | array of 1 to 10 objects |
| `items[].menuItemId` | positive integer; unique within the array |
| `items[].quantity` | integer 1 to 10 (not a string, not a decimal) |
| `pickupNote` | optional string, trimmed, at most 200 characters; empty becomes `null` |
| Any other field | rejected (for example `totalSatang`, `unitPriceSatang`, `customerId`, `status`) |

**Permissions.** Submit: Customer only. Detail: owner Customer or any Operator. "My orders": Customer only.

**Failure and boundary cases.**
- Quantity 0, negative, decimal, string or above 10 returns 400 and nothing is saved (AC-18); an empty item list, more than 10 lines or a duplicated item returns 400 (AC-19).
- `pickupNote` boundary: 201 characters returns 400, exactly 200 characters is accepted (AC-20).
- A disabled item or stock 0 returns 409 `ITEM_UNAVAILABLE`, and a quantity above the available stock returns 409 (AC-21, AC-22).
- One failing line rolls the whole order back: other lines keep their stock and no order exists (AC-22).
- Two orders competing for the last unit: exactly one 201, the other 409, stock ends at 0 (AC-24).
- A client-supplied `totalSatang`, `unitPriceSatang`, `status` or any unknown field returns 400, with no order and unchanged stock (AC-16).
- Anonymous returns 401, an Operator submitting returns 403, a non-owner read returns 403, a missing order returns 404 and a non-numeric id returns 400 (AC-26, AC-27); `GET /api/orders/mine` returns 403 for an Operator and 401 anonymously (AC-28).
- In the UI a 409 keeps the cart contents and does not navigate away (AC-30), and loading, empty and error states are shown (AC-31).

### 2. API specification

#### `POST /api/orders`
Request:
```json
{ "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 4, "quantity": 1 } ],
  "pickupNote": "Pickup at 12:30" }
```
201 response (sets header `Location: /api/orders/:id`):
```json
{ "order": {
  "id": 12, "orderNumber": "CB-000012",
  "status": "PENDING", "paymentStatus": "UNPAID",
  "totalSatang": 15000, "pickupNote": "Pickup at 12:30",
  "items": [
    { "menuItemId": 1, "itemName": "Basil Pork Rice", "unitPriceSatang": 6000, "quantity": 2, "lineTotalSatang": 12000 },
    { "menuItemId": 4, "itemName": "Thai Iced Tea",  "unitPriceSatang": 3000, "quantity": 1, "lineTotalSatang": 3000 } ],
  "history": [ { "fromStatus": null, "toStatus": "PENDING", "actorRole": "CUSTOMER", "createdAt": "2026-11-05T05:00:00.000Z" } ],
  "createdAt": "2026-11-05T05:00:00.000Z", "updatedAt": "2026-11-05T05:00:00.000Z" } }
```
| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Schema violation, unknown field, unknown `menuItemId`, malformed JSON |
| 401 | `UNAUTHENTICATED` | No valid session |
| 403 | `FORBIDDEN` | Role is not `CUSTOMER` |
| 409 | `ITEM_UNAVAILABLE` | Item disabled or not enough stock. `details`: `{ "menuItemId": 6, "requested": 1, "available": 0 }` |

#### `GET /api/orders/mine`
200: `{ "orders": [ { "id", "orderNumber", "status", "paymentStatus", "totalSatang", "itemCount", "createdAt" } ] }`, newest first, only the caller's orders (at most 200). 401 anonymous; 403 Operator.

#### `GET /api/orders/:id`
| Status | When |
|---|---|
| 200 | Body `{ "order": { ...same shape as the 201 response } }`. Caller is the owner Customer, or an Operator (the Operator view adds `customer: { id, displayName }`, see F-04) |
| 400 | `:id` is not a positive integer |
| 401 | No session |
| 403 | Customer is not the owner. Body is the generic error only |
| 404 | No such order |

### 3. UI specification
| Element | Behavior |
|---|---|
| Menu page cart | Each available item has a quantity stepper capped at `Math.min(10, stockQty)` and "Add" control; cart line quantity stepper is similarly capped by `stockQty`. Cart summary lists lines and an **"Estimated total"** (client-side, labelled as an estimate) |
| Pickup note | Text input, max 200 characters with counter |
| Place order | Disabled when the cart is empty or the user is not logged in (anonymous users see "Log in to order" linking to `/login`). Shows "Placing order…" while pending |
| Success | Cart cleared; redirect to `/orders/:id` |
| Failure | 409 shows the server message (for example "Chicken Sandwich is sold out"); the cart is kept so the user can edit it |
| Order detail `/orders/:id` | Order number, status badge, payment status, items with unit price and line total, total, pickup note, history timeline |
| My orders `/orders` | Table of own orders (number, status, total, date), each linking to the detail. Empty: "You have no orders yet." Loading and error states |

### 4. Data specification
| Table | Change |
|---|---|
| `Order`, `OrderItem`, `OrderStatusHistory`, `MenuItem.stockQty` | Tables and CHECK constraints already exist from migration `0001_init` (R-03). No new migration. If a migration becomes necessary, record a contract revision |

### 5. Acceptance criteria

| AC | Statement |
|---|---|
| AC-14 | A Customer's valid order returns 201 with status `PENDING`, payment status `UNPAID` and an `orderNumber` of the form `CB-` plus the id padded to 6 digits. Retrieving it afterwards through `GET /api/orders/:id` returns the same items, total and status, and the database holds one `Order` and the matching `OrderItem` rows. |
| AC-15 | The total equals the sum of unit price × quantity using the **current database prices**, calculated by the server. |
| AC-16 | A request containing a client-supplied `totalSatang`, `unitPriceSatang` or any other unknown field returns 400 `VALIDATION_ERROR`; no order is saved and stock is unchanged. |
| AC-17 | After a menu item's price changes, existing orders keep their original unit price and total. |
| AC-18 | A quantity of 0, a negative number, a decimal, a string or a value above 10 returns 400; no order is saved. |
| AC-19 | An empty item list, more than 10 lines, or the same `menuItemId` twice returns 400; no order is saved. |
| AC-20 | A `pickupNote` longer than 200 characters returns 400; a note of exactly 200 characters is accepted. |
| AC-21 | Ordering a disabled item or an item with stock 0 returns 409 `ITEM_UNAVAILABLE`; no order is saved and stock is unchanged. |
| AC-22 | Ordering more than the available stock returns 409. When one line of a multi-line order fails, **no** line is applied: stock of the other lines is unchanged and no order exists. |
| AC-23 | A successful order reduces each ordered item's stock by exactly the ordered quantity. |
| AC-24 | When two customers simultaneously order the last unit of an item, exactly one request succeeds with 201 and the other returns 409; stock ends at 0 (never negative) and only one order contains the item. |
| AC-25 | Creating an order writes exactly one history entry: from nothing to `PENDING`, actor role `CUSTOMER`, actor = the ordering customer. The entry appears in the order detail. Each history entry carries a `createdAt` timestamp. |
| AC-26 | An Operator submitting an order gets 403 and an anonymous request gets 401; no order is saved and stock is unchanged. |
| AC-27 | A Customer requesting another Customer's order gets 403 `FORBIDDEN` with no order data; the owner gets 200; a missing id gets 404; a non-numeric id gets 400. |
| AC-28 | `GET /api/orders/mine` returns only the caller's orders, newest first; an Operator gets 403 and an anonymous caller gets 401. |
| AC-29 | In the UI a Customer adds items, places the order and sees the saved order detail with the correct total; after a page reload the same data is shown and the order appears in "My orders". |
| AC-30 | In the UI a 409 `ITEM_UNAVAILABLE` response shows the error message, keeps the cart contents and does not navigate away. |
| AC-31 | The "My orders" screen shows a loading state, an empty state ("You have no orders yet."), an error state, and a table of orders. |

### 6. Software Test Specification (STS)

| Test | AC | Level | Precondition and input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-14 | AC-14 | Integration | Logged in `customer1`; seed prices item 1 = 6000, item 4 = 3000 | POST `/api/orders` with 1×2 and 4×1, then GET `/api/orders/:id` | 201; `status` `PENDING`; `paymentStatus` `UNPAID`; `orderNumber` matches `^CB-\d{6}$` and equals id padded; GET returns equal items and `totalSatang` 15000; DB has 1 `Order` and 2 `OrderItem` rows |
| TEST-15 | AC-15 | Unit + Integration | Unit: lines (6000×2), (3000×1). Integration: set item 1 price to 7000 in DB first | Unit: `calculateOrderTotal`. Integration: POST the same order | Unit result 15000. Integration `totalSatang` 17000 (uses current DB price) |
| TEST-16 | AC-16 | Integration | Logged in `customer1`; order count 0; stock noted | POST with `totalSatang: 1`; POST with `items[0].unitPriceSatang: 1`; POST with `status: "ACCEPTED"` | Each returns 400 `VALIDATION_ERROR`; order count still 0; stock unchanged |
| TEST-17 | AC-17 | Integration | Customer order exists for item 1 × 2 at 6000 | Update `MenuItem` 1 price to 9000 in the DB; GET the order | `unitPriceSatang` 6000 and `totalSatang` 12000 unchanged |
| TEST-18 | AC-18 | Unit + Integration | Logged in `customer1` | POST with quantity 0, -1, 1.5, "2", 11 | Each 400 `VALIDATION_ERROR`; order count 0; the schema unit test rejects the same values |
| TEST-19 | AC-19 | Integration | Logged in `customer1`; 11 menu items exist (extra created by test helper) | POST with `items: []`; with 11 distinct lines; with item 1 listed twice | Each 400; order count 0 |
| TEST-20 | AC-20 | Integration | Logged in `customer1` | POST with a 201-character `pickupNote`; then with a 200-character note | 201-character: 400. 200-character: 201 and the note is stored |
| TEST-21 | AC-21 | Integration | Seed: item 6 stock 0; item 7 disabled | POST order for item 6; POST order for item 7 | Each 409 `ITEM_UNAVAILABLE` with `details.menuItemId`; order count 0; stock unchanged |
| TEST-22 | AC-22 | Integration | Item 1 stock 3 (set by test); item 6 stock 0 | POST item 1 × 4; POST lines [item 1 × 1, item 6 × 1] | Both 409. After the second call item 1 stock is still 3 and no order exists |
| TEST-23 | AC-23 | Integration | Item 1 stock 30 | POST item 1 × 2 | 201; item 1 stock is 28 |
| TEST-24 | AC-24 | Integration | Item 5 stock 1; `customer1` and `customer2` logged in | Send two `POST /api/orders` for item 5 × 1 at the same time with `Promise.all` | One 201 and one 409 `ITEM_UNAVAILABLE`; stock is 0; exactly one `OrderItem` references item 5. Repeat 10 times: always the same outcome |
| TEST-25 | AC-25 | Integration | Logged in `customer1` | POST a valid order; GET it | History has exactly 1 row: `fromStatus` null, `toStatus` `PENDING`, `actorRole` `CUSTOMER`, `actorId` = customer1; detail response lists it; the history row has a non-null `createdAt` that is a valid date and not in the future |
| TEST-26 | AC-26 | Integration | `operator1` logged in; no-cookie client | POST a valid order body with each | Operator 403 `FORBIDDEN`; anonymous 401 `UNAUTHENTICATED`; order count 0; stock unchanged |
| TEST-27 | AC-27 | Integration | Order O1 owned by `customer1`; `customer2` logged in | `customer2` GET O1; `customer1` GET O1; GET `/api/orders/99999`; GET `/api/orders/abc` | 403 with body containing only the error object (no items, total or status); 200; 404; 400 |
| TEST-28 | AC-28 | Integration | `customer1` has 2 orders; `customer2` has 1 | `customer1` GET `/api/orders/mine`; operator GET; anonymous GET | Exactly the 2 orders of `customer1`, newest first, none from `customer2`; operator 403; anonymous 401 |
| TEST-29 | AC-29 | End-to-end | Seeded database; `customer1` | Playwright: log in, add Basil Pork Rice × 2 and Thai Iced Tea × 1, type a note, click "Place order", reload the page, open "My orders" | Detail shows `CB-` number, "Pending", total `฿150.00`; after reload the same data; the order is listed in "My orders" |
| TEST-30 | AC-30 | UI component | API client mocked to return 409 `ITEM_UNAVAILABLE` | Render the menu page with a cart of 2 lines, click "Place order" | Error message is shown; cart still has 2 lines; no navigation |
| TEST-31 | AC-31 | UI component | API client mocked: pending, empty list, error, list of 2 orders | Render "My orders" in each state | "Loading…"; "You have no orders yet."; error alert; table with 2 rows showing number, status, total |

Planned test files: `backend/tests/orders.create.test.ts`, `backend/tests/orders.access.test.ts`, `backend/src/services/orderRules.test.ts`, `frontend/src/pages/Menu.test.tsx`, `frontend/src/pages/MyOrders.test.tsx`, `frontend/e2e/order.spec.ts`.

### 7. Definition of Done (feature-specific)
In addition to the Product Definition of Done:
- TEST-14 to TEST-31 executed and passing, results recorded.
- **TDD evidence** (red then green with commit IDs) for TEST-24 (concurrent last unit) and TEST-15 (server-side total).
- Screenshots: filled cart, order detail with total, 409 error message, My orders. API output showing a 403 for a cross-customer read.
- The concurrency test runs against the real PostgreSQL test database (no mock).
- The availability rule is imported from F-02 (`isOrderable`), not duplicated.

---

## 10. F-04 — Operator Order List and Acceptance (Engineering Contract)

| Item | Value |
|---|---|
| Feature | F-04 Operator order list and acceptance |
| Requirements | FR-08, FR-09, BR-06, BR-07, BR-08, BR-15 |
| Sprint | 1 |
| Depends on | F-01, F-03, R-01 |
| Contract version | 1.5 (2026-11-07) |
| Issue / branch | ISSUE-6 / `feature/F-04-operator-acceptance` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contract | Before implementation |
| 1.1 | 2026-11-05 | AC-34 and TEST-34 assert the accept history `createdAt` | Cover BR-15's timestamp clause |
| 1.2 | 2026-11-05 | Added a Failure and boundary cases subsection citing AC-33, AC-35 to AC-38, AC-40 and AC-42 | Document failure and boundary behavior already defined by the AC and STS |
| 1.3 | 2026-11-07 | Contract revision for AC-42 / TEST-42: wrong-role navigation renders in-place 403 Forbidden alert and suppresses operator table, rather than redirecting, matching ProtectedRoute behavior established in d7ec1c2 (DEC-23) | Team Decision 1 (Option A) to preserve existing role guard contract |
| 1.4 | 2026-11-07 | Clarified UI 409 alert message ("This order was already handled.") with filter reconciliation on resolution, and strengthened TEST-40 with synchronization barrier and exact history assertions | Follow-up code review fixes |
| 1.5 | 2026-11-07 | TEST-40 iteration count set to 10 with barrier synchronization as required by AC-40 contract | Contract compliance fix |

### 1. Feature design

**Behavior.** A logged-in Operator sees the incoming orders, oldest first so the longest-waiting order is handled first, can filter by status, opens any order, and accepts a `PENDING` order. Acceptance changes the status to `ACCEPTED` and writes a history entry. The Customer sees the new status on their order.

**Workflow (`POST /api/orders/:id/accept`).**
1. Authenticate (401) and require role `OPERATOR` (403).
2. Validate `:id` is a positive integer (400); load the order (404 if missing).
3. In one transaction run a conditional update: `UPDATE "Order" SET status = 'ACCEPTED' WHERE id = :id AND status = 'PENDING'`.
4. If zero rows were updated the order is not `PENDING`: return 409 `INVALID_TRANSITION`, with no history entry (BR-06). This also makes two simultaneous accepts safe.
5. Insert history: `PENDING → ACCEPTED`, actor = operator, role `OPERATOR` (BR-15).
6. Return 200 with the updated order.

**Business rules.** BR-06 (only `PENDING → ACCEPTED` exists in Sprint 1; any other transition attempt from this endpoint is rejected), BR-07 (Operators may view all orders), BR-08 (customers cannot accept), BR-15.

**Validation.** `:id` positive integer. `status` query value must be one of `PENDING, ACCEPTED, REJECTED, CANCELLED, PREPARING, READY, COMPLETED`. Accept takes no body.

**Permissions.** List all orders, view any order, accept: Operator only.

**Shared transition rule.** `assertTransition(from, to)` is a pure function in `orderStateMachine.ts` listing allowed transitions. Sprint 1 contains `PENDING → ACCEPTED`; later sprints add the rest of the SRS table (section 7).

**Failure and boundary cases.**
- Accepting an order that is not `PENDING` returns 409 `INVALID_TRANSITION`, leaves the status unchanged and writes no history row (AC-35).
- A non-existent order returns 404, and a non-numeric id returns 400 (AC-36).
- A Customer calling accept gets 403 and the order stays `PENDING`; an anonymous call gets 401 (AC-37).
- A Customer calling the operator list gets 403 and an anonymous call gets 401, neither with order data (AC-38).
- An unknown `status` filter value returns 400 `VALIDATION_ERROR` (AC-33).
- Two Operators accepting the same order at once: exactly one 200, one 409, and exactly one `PENDING → ACCEPTED` history row (AC-40).
- A Customer opening `/operator/orders` sees an in-place 403 Forbidden alert and no operator table; that role guard is navigation only, and backend protection is what AC-37 and AC-38 prove (AC-42).

### 2. API specification

#### `GET /api/orders` (Operator)
| Item | Spec |
|---|---|
| Query | Optional `status` |
| 200 | `{ "orders": [ { "id", "orderNumber", "customer": { "id", "displayName" }, "status", "paymentStatus", "totalSatang", "itemCount", "createdAt" } ] }` ordered by `createdAt` ascending, at most 200 rows |
| 400 | `VALIDATION_ERROR` for an unknown `status` value |
| 401 / 403 | Anonymous / Customer |

#### `GET /api/orders/:id` (Operator view)
Same endpoint as F-03. For an Operator it returns 200 for any existing order and adds `customer: { id, displayName }`. The customer's email and password hash are never returned.

#### `POST /api/orders/:id/accept` (Operator)
| Status | Code | When |
|---|---|---|
| 200 | — | `{ "order": { ...order detail... } }` with `status` `ACCEPTED` and a new history row |
| 400 | `VALIDATION_ERROR` | Invalid `:id` |
| 401 | `UNAUTHENTICATED` | No session |
| 403 | `FORBIDDEN` | Caller is a Customer |
| 404 | `NOT_FOUND` | No such order |
| 409 | `INVALID_TRANSITION` | Order is not `PENDING`; `details: { "from": "ACCEPTED", "to": "ACCEPTED" }` |

### 3. UI specification
| Element | Behavior |
|---|---|
| `/operator/orders` | Table: order number (link), customer name, item count, total, status badge, created time, and an **Accept** button on `PENDING` rows only |
| Filter | Tabs or select for All, Pending, Accepted, and so on; default Pending |
| Accept | Click shows "Accepting…" on that row; on success the row's badge changes to Accepted and the button disappears; on 409 an alert says the order was already handled ("This order was already handled.") and the list reloads |
| Loading, empty, error | "Loading orders…", "No orders to show.", error alert with Retry |
| Role guard | A Customer opening `/operator/orders` sees an in-place 403 Forbidden alert ("403 Forbidden: You have no access to this page.") and no operator table (navigation only; the API enforces access) |
| Customer view | The order detail page shows the new status and history entry after reload |

### 4. Data specification
| Table | Change |
|---|---|
| `Order`, `OrderStatusHistory` | No schema change (tables from `0001_init`). History rows record `actorRole` `OPERATOR` |

### 5. Acceptance criteria

| AC | Statement |
|---|---|
| AC-32 | `GET /api/orders` as an Operator returns orders from all customers, oldest first, each with order number, customer display name, status, payment status, total and item count. |
| AC-33 | The `status` filter returns only orders in that status; an unknown status value returns 400 `VALIDATION_ERROR`. |
| AC-34 | Accepting a `PENDING` order returns 200, the order becomes `ACCEPTED` in the database, and one history row (`PENDING → ACCEPTED`, actor role `OPERATOR`, actor = the operator) is added. The accept history entry carries a `createdAt` timestamp. |
| AC-35 | Accepting an order that is not `PENDING` returns 409 `INVALID_TRANSITION`; the status is unchanged and no history row is added. |
| AC-36 | Accepting a non-existent order returns 404; a non-numeric id returns 400. |
| AC-37 | A Customer calling the accept endpoint (including for their own order) gets 403; the order stays `PENDING` and no history is added. An anonymous call gets 401. |
| AC-38 | A Customer calling `GET /api/orders` gets 403 and an anonymous caller gets 401; neither response contains order data. |
| AC-39 | An Operator can open any customer's order through `GET /api/orders/:id`; the response includes the customer's display name and no email or password hash. |
| AC-40 | When two Operators accept the same `PENDING` order at the same time, exactly one gets 200 and the other gets 409; the order has exactly one `PENDING → ACCEPTED` history row. |
| AC-41 | In the UI an Operator sees a new order, clicks Accept, sees the status change to Accepted, and the Customer then sees "Accepted" on their order after logging in again. |
| AC-42 | In the UI a Customer who opens `/operator/orders` sees an in-place 403 Forbidden alert and no operator table. (Navigation convenience only; backend protection is proven by AC-37 and AC-38.) |

### 6. Software Test Specification (STS)

| Test | AC | Level | Precondition and input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-32 | AC-32 | Integration | Orders O1 (older, `customer1`) and O2 (newer, `customer2`); `operator1` logged in | GET `/api/orders` | 200; O1 before O2; both present; each has `customer.displayName`, `totalSatang`, `itemCount`; no `email` field |
| TEST-33 | AC-33 | Integration | One `PENDING` and one `ACCEPTED` order | GET `?status=PENDING`; GET `?status=ACCEPTED`; GET `?status=BOGUS` | Only the matching order each time; `BOGUS` returns 400 `VALIDATION_ERROR` |
| TEST-34 | AC-34 | Integration | `PENDING` order O1; `operator1` logged in | POST `/api/orders/O1/accept`; read the DB | 200; DB status `ACCEPTED`; history rows for O1 = 2 (create, accept); the accept row: `fromStatus` `PENDING`, `toStatus` `ACCEPTED`, `actorRole` `OPERATOR`, `actorId` = operator1; the accept row has a non-null `createdAt` that is a valid date and not earlier than the create row's `createdAt` |
| TEST-35 | AC-35 | Unit + Integration | Unit: `assertTransition('ACCEPTED','ACCEPTED')` and `('ACCEPTED','PENDING')`. Integration: O1 already `ACCEPTED` | Unit: call. Integration: POST accept again | Unit throws `INVALID_TRANSITION`. Integration: 409 `INVALID_TRANSITION`; status unchanged; history row count unchanged |
| TEST-36 | AC-36 | Integration | `operator1` logged in | POST `/api/orders/99999/accept`; POST `/api/orders/abc/accept` | 404 `NOT_FOUND`; 400 `VALIDATION_ERROR` |
| TEST-37 | AC-37 | Integration | `customer1` owns `PENDING` order O1 | `customer1` POST accept on O1; anonymous POST accept on O1 | 403 `FORBIDDEN`; 401 `UNAUTHENTICATED`; O1 still `PENDING`; history rows unchanged |
| TEST-38 | AC-38 | Integration | Orders exist; `customer1` logged in | `customer1` GET `/api/orders`; anonymous GET `/api/orders` | 403; 401; neither body contains `orders` or any order data |
| TEST-39 | AC-39 | Integration | Order O1 owned by `customer1`; `operator1` logged in | GET `/api/orders/O1` | 200; includes `customer.displayName`; body does not contain `email` or `passwordHash` |
| TEST-40 | AC-40 | Integration | `PENDING` order O1; `operator1` and `operator2` logged in | Two `POST accept` calls at the same time with `Promise.all`; repeat 10 times with new orders | One 200 and one 409 each time; exactly one accept history row per order |
| TEST-41 | AC-41 | End-to-end | `customer1` has submitted an order (created in the test) | Playwright: log in as operator1, open `/operator/orders`, click Accept on the order, check badge; log out; log in as customer1, open the order | Operator sees "Accepted" and no Accept button for that row; customer sees status "Accepted" and a history entry |
| TEST-42 | AC-42 | End-to-end | `customer1` logged in | Playwright: navigate to `/operator/orders` | In-place 403 Forbidden alert is rendered ("403 Forbidden: You have no access to this page."); operator table is not shown |

Planned test files: `backend/tests/orders.operator.test.ts`, `backend/src/services/orderStateMachine.test.ts`, `frontend/e2e/operator.spec.ts`.

### 7. Definition of Done (feature-specific)
In addition to the Product Definition of Done:
- TEST-32 to TEST-42 executed and passing, results recorded.
- **TDD evidence** (red then green with commit IDs) for TEST-35 (invalid transition) and TEST-40 (double accept).
- Screenshots: operator order list, accept result, customer view showing Accepted. API output showing a Customer receiving 403 on accept.
- The state machine is a single shared function (no duplicated transition logic in controllers).

---

## 11. R-01, R-02, R-03 — Cross-Cutting Responsibilities (Engineering Contract)

| Item | Value |
|---|---|
| Responsibilities | R-01 Access control, R-02 Validation and error handling, R-03 Setup, migrations and seed |
| Requirements | NFR-01, NFR-02, NFR-07, NFR-08, BR-07, BR-08, BR-13 (database CHECK part) |
| Sprint | 1 (extended in Sprints 2 and 3) |
| Depends on | none (R-03 is built first) |
| Contract version | 1.0 (2026-11-03) |
| Issues / branches | ISSUE-1 `feature/R-03-setup-seed`; ISSUE-3 `feature/R-01-R-02-access-errors` |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-03 | Initial contract | Before implementation |

### 1. Design

#### R-01 Access control
- `requireAuth` middleware: reads cookie `cb_session`, hashes it, finds a non-expired `Session`, loads the user, attaches `req.user` (id, role). Otherwise 401 `UNAUTHENTICATED`.
- `requireRole(...roles)` middleware: 403 `FORBIDDEN` if `req.user.role` is not allowed.
- Ownership checks live in services (for example a Customer reading an order requires `order.customerId === req.user.id`).
- A **route registry** (`protectedRoutes` array: method, path, allowed roles) is the single list used by the router and by the access test. A meta-test fails if an Express route exists that is not in the registry or in the explicit public list. This forces every future endpoint (Sprints 2 and 3) to be covered by NFR-01 and NFR-02 tests.
- Public routes: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/menu`, `GET /api/health`.

#### R-02 Validation and error handling
- zod `.strict()` schemas per endpoint; validation errors become 400 `VALIDATION_ERROR` with `details` listing the fields.
- One error handler returns `{ "error": { "code", "message", "details?" } }`. Known application errors map to their status. Anything else becomes 500 `INTERNAL_ERROR` with the message "Something went wrong." The real error is logged on the server only.
- Malformed JSON (parser error) maps to 400 `VALIDATION_ERROR`.

#### R-03 Setup, migrations and seed
- Prisma schema and migration `0001_init` create all Sprint 1 tables with CHECK constraints added as raw SQL (price above 0, stock at least 0, quantity 1 to 10) and UNIQUE constraints.
- Idempotent seed (users and menu from System SDS section 2.3). Passwords come from `SEED_CUSTOMER_PASSWORD` and `SEED_OPERATOR_PASSWORD`.
- `.env.example` with placeholders, `docker-compose.yml` for local PostgreSQL, README with the setup commands below.
- `GET /api/health` returns `{ "status": "ok", "version": "<git sha or dev>" }` (used later by deployment checks).

README setup (target 8 commands or fewer, NFR-08):
1. `git clone <repository URL>`
2. `cp backend/.env.example backend/.env`
3. `docker compose up -d db`
4. `npm install`
5. `npm run db:reset` (migrate and seed)
6. `npm run dev` (API and frontend)
7. `npm test` (unit, API and component tests)
8. `npm run e2e` (Playwright, with the dev server running)

### 2. API specification
R-01 to R-03 add no business endpoints. They add `GET /api/health` (200 `{ "status": "ok", "version": "..." }`, public) and define the shared behavior of the 401, 403, 400 and 500 responses used by every endpoint (see System SDS section 4).

### 3. UI specification
No new screens. Shared behavior from the System SDS applies: the API client shows `error.message` from the standard error shape, and a generic message for network errors or 500.

### 4. Data specification
| Item | Spec |
|---|---|
| Migration `0001_init` | Creates `User`, `Session`, `MenuItem`, `Order`, `OrderItem`, `OrderStatusHistory`, enums, indexes and CHECK constraints |
| CHECK constraints | `MenuItem.priceSatang > 0`; `MenuItem.stockQty >= 0`; `OrderItem.quantity BETWEEN 1 AND 10`; `Order.totalSatang >= 0` |
| UNIQUE | `User.email`; `Session.tokenHash`; `MenuItem.name`; `(OrderItem.orderId, OrderItem.menuItemId)` |
| Seed | 4 users and 7 menu items, repeatable without duplicates |

### 5. Acceptance criteria

| AC | Statement |
|---|---|
| AC-43 | Every protected route in the route registry returns 401 `UNAUTHENTICATED` without a session, and 403 `FORBIDDEN` for each role that is not allowed, with no private data in either response. A meta-test fails if the application has a route that is neither in the registry nor in the public list. |
| AC-44 | A malformed JSON body returns 400 `VALIDATION_ERROR` in the standard shape. An unexpected server error returns 500 `INTERNAL_ERROR` with a generic message, and the response body contains no stack trace, SQL text or the word "Prisma". |
| AC-45 | Running the seed twice leaves exactly 4 users and 7 menu items (no duplicates). A fresh clone reaches a running application and a passing `npm test` using the README commands (8 commands or fewer). |
| AC-46 | The database itself rejects: a menu price of 0 or below, negative stock, an order line quantity of 0 or 11, a duplicate item in one order, and a duplicate user email, even when the SQL bypasses the API. |

### 6. Software Test Specification (STS)

| Test | AC | Level | Precondition and input | Action | Expected result |
|---|---|---|---|---|---|
| TEST-43 | AC-43 | Integration | Route registry; seeded users; one session per role | For each protected route: call anonymously; call with each non-allowed role; then list the Express routes | Anonymous: 401 each. Wrong role: 403 each. No response contains `orders`, `items`, `user` or `email` data. Meta-check: every registered route is in the registry or the public list |
| TEST-44 | AC-44 | Integration | Test-only route or mocked service that throws `new Error("db password leak")` | POST `/api/auth/login` with body `{bad json`; call the failing route | 400 `VALIDATION_ERROR` with standard shape. Failing route: 500 `INTERNAL_ERROR`, message "Something went wrong.", body does not contain "db password leak", "stack", "SELECT" or "Prisma" |
| TEST-45 | AC-45 | Integration + Manual | Empty test database | Run the seed twice; count users and menu items. Manual: follow README on a fresh clone and count commands | 4 users and 7 menu items after both runs. Manual: 8 commands or fewer, app opens, `npm test` passes. (Manual part is recorded with a screenshot and is a supplement to the automated seed test.) |
| TEST-46 | AC-46 | Integration | Test database with one user, item and order | Run raw SQL inserts and updates through Prisma `$executeRaw`: price 0; stock -1; quantity 0; quantity 11; same `(orderId, menuItemId)` twice; second user with the same email; update stock below 0 | Each statement fails with a constraint violation; row counts unchanged |

Planned test files: `backend/tests/routes.access.test.ts`, `backend/tests/errors.test.ts`, `backend/tests/seed.test.ts`, `backend/tests/db.constraints.test.ts`.

### 7. Definition of Done (feature-specific)
In addition to the Product Definition of Done:
- TEST-43 to TEST-46 executed and passing, results recorded.
- The route registry exists and the meta-test is enabled (not skipped).
- README commands verified on a fresh clone by the teammate who did not write them.
- `.env.example` has placeholders only; `.env` is in `.gitignore`.
- Red-then-green evidence kept for TEST-43 (add a route without registering it and watch the meta-test fail).
