# Omazon — CR-01 Impact Analysis (Lab 7 Part A)

| Item | Value |
|---|---|
| Document | `docs/labs/lab-07/CR-01-impact-analysis.md` |
| Change request | CR-01, CHG-07, Issues [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76) and [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77) |
| Version | 1.0 |
| Date | 2026-11-28 |
| Method | Reading of the code, tests, workflows and documents at `d85f1be`. **Nothing was built or run.** Every statement about how a test will behave is **to be confirmed in #78** |
| Line numbers | All are line numbers at `d85f1be` (`git show d85f1be:<path>`). The CR-01 revision commits move later document lines |
| Status | Contract revision proposed. Team approval and teammate review pending ([review sheet](CR-01-contract-review.md)). Not implemented |

**The rule (DEC-58).** For an orderable item, the maximum quantity per line is `min(5, max(1, floor(stockQty / 2)))`. The request ceiling is 5. Lines per order stay 1 to 10, with no duplicate item.

Document short names: **SRS** = `docs/srs.md`; **S1** = `docs/sprints/sprint-1/features.md` (Feature SDS, ACs and STS); **SYS** = `docs/system-sds.md`.

## 1. Requirement impact table

| Req | Feature | SRS / Feature SDS / System-Level SDS (lines) | AC | STS | Code modules |
|---|---|---|---|---|---|
| **BR-01** (changed) | F-03; F-02 (menu field, selector) | SRS 99. S1 F-03: 373, 380, 387, 438. SYS 72, 139, 161, 223, 250 | AC-18 revised; AC-19 unchanged; new AC-148 to AC-151, AC-156, AC-160 | TEST-18 revised; TEST-19 unchanged; TEST-148 to 151, 156, 160 | `middleware/validate.ts` 23-24; `services/menuRules.ts` (new `maxLineQuantity`); `services/orderService.ts` 236-278; `pages/Menu.tsx` 9, 66-69, 112-124 |
| **BR-02** (changed: a line over its maximum also rejects the whole order) | F-02 (defines), F-03 (enforces) | SRS 100. S1 F-02: 275, 291, 314; F-03: 365-367, 389, 421, 462-463. SYS 73 | AC-10 revised (menu field); AC-11, AC-21, AC-22, AC-30 wording unchanged; new AC-152, 153, 157, 158, 159 | TEST-10 revised; TEST-11, 21, 22, 30 unchanged; TEST-152, 153, 157 to 159 | `services/menuRules.ts` 10-11 (`isOrderable` unchanged); `services/orderService.ts` 251-277, 298-339; `services/menuService.ts` 7-16; `frontend/src/api/menu.ts` 3-11; `pages/Menu.tsx` 130-164 |
| **BR-05** (preserved) | F-03 | SRS 103. S1: 367, 465, 488. SYS 65, 76 (76 says conditional `updateMany`; the code is a raw `UPDATE`, corrected in SYS 1.12) | AC-23, AC-24 unchanged; new AC-154 | TEST-23, 24, 46, 59, 94 unchanged; TEST-154 | `orderService.ts` 241-249 (one more `WHERE` condition), 283-284 (lock order), 220-230 (`restoreStock`, unchanged) |
| **BR-03** (preserved) | F-03 | SRS 101. S1: 369, 456 | AC-15, AC-16 unchanged | TEST-15, 16 unchanged | `orderRules.ts` 7-9, `orderService.ts` 310, 314 (unchanged) |
| **BR-07** (preserved) | F-03 | SRS 105. S1: 384, 468-469 | AC-27, AC-28 unchanged | TEST-27, 28, 39, 65, 74 unchanged | Order read services (unchanged) |
| **R-01** (preserved) | Cross-cutting | SYS 287-315 (§4.1, §5). S1 §11: 640-730 | AC-26, AC-43, AC-90 to AC-92 unchanged | TEST-26, 37, 38, 43, 90 to 92 unchanged | `routes/registry.ts`, `routes/orders.ts` (no route added or changed) |

Backend paths are under `backend/src/`; `pages/Menu.tsx` is `frontend/src/pages/Menu.tsx`.

## 2. Areas considered

| Area | Affected? | Finding or N/A reason |
|---|---|---|
| Callers of the order transaction | No signature change | `orderService.create` is called only by `controllers/orderController.ts` 14. `reserveStock` is private to `orderService.ts`. `routes/orders.ts` 28 applies `orderCreateSchema` |
| Callers of the menu mapper | Yes | `toMenuViewItem` (`menuService.ts` 11-16) is used by `list` (36), `create` (43) and `update` (53), so `GET /api/menu`, `POST /api/menu-items` and `PATCH /api/menu-items/:id` all gain the field |
| `isOrderable` | No change | Used by `menuService.ts` 14 and `orderService.ts` 258. The cap is a separate function, so TEST-11 is not affected |
| API consumers of the menu | Checked | `Menu.tsx` uses the new field. `OperatorMenu.tsx` stores returned items (182, 196, 232) and TEST-56 expects a PATCH body with changed fields only (test lines 145-147); it must never send `maxOrderQuantity` (the strict schemas would reject it). `deploy/smoke_test.py` 55 checks only a non-empty `items` list. `benchmarks/nfr05-load.js` calls `GET /api/menu` (178) and orders quantity 1 (185): no change expected, not run. E2E: `order.spec.ts` (see §5) |
| API validation | Yes | `validate.ts` 24: `.max(10)` → `.max(5)`. Zod cannot see stock, so the stock-aware part is in the service. Because validation runs first, a quantity of 6 to 10 returns 400 even for a sold-out or disabled item (today 409) |
| UI validation | Yes | `Menu.tsx` 67 uses `min(10, stockQty)`. It will use `maxOrderQuantity`. Lines 74, 86, 248, 281 and 304 follow through `maxOrderable`. The fallback for a cart item missing from the menu (114, 281) becomes the static ceiling 5. The 409 handler (146-160) also clamps the named line. The UI remains a convenience; the server is authoritative |
| Roles and ownership | N/A | No route, role guard or ownership check changes. The new check runs after authentication, the `CUSTOMER` role guard and body validation |
| Persistence | No schema change | No table, column or index changes. `maxOrderQuantity` is computed, not stored |
| Database constraint | Kept | `OrderItem_quantity_check CHECK (quantity 1..10)`, `prisma/migrations/20261105161538_0001_init/migration.sql` 124. After CR-01 the database no longer enforces the new upper limit (5 or the stock-aware maximum) by itself (DEC-64) |
| Historical data and migrations | No migration proposed | Stored lines with quantity 6 to 10 stay inside the `CHECK`. `orderCreateSchema` applies to the `POST /api/orders` body only. Cancel and reject add the stored quantity back (`orderService.ts` 224-229) with no cap. **From code reading only: not tested, and deployed data was not queried** |
| Concurrency | Yes | Today there is no stock read before the single conditional `UPDATE` and no isolation level is set. DEC-59 adds the cap to that `UPDATE ... WHERE`, so check and decrement remain one statement. Ascending `menuItemId` order (284) is kept. The design relies on PostgreSQL re-checking the `WHERE` condition on the newest row version after a row-lock wait (Read Committed). **Not tested**: TEST-154. The error read after a zero-row update is a second statement and can see newer stock (DEC-60) |
| Rule duplication | New risk | The formula exists in TypeScript (`maxLineQuantity`) and in SQL. TEST-160 compares them for stock 0 to 30 |
| Error codes | Yes | New 409 `QUANTITY_LIMIT_EXCEEDED`, `details: { itemId, allowedMax }`. The list of codes is in SYS §4 (239-253); the SRS has none and the code has no central list. Existing `ITEM_UNAVAILABLE` keeps `details: { menuItemId, requested, available }` |
| Multi-line behaviour | Yes | The transaction stops at the first failing line in ascending `menuItemId` order, so one response reports one line and one code |
| Other documents | Partly | `docs/features.md` 29-30 (F-02, F-03 descriptions): N/A, they state no quantity limit. SRS FR-05 (81): N/A, "items, quantities and an optional pickup note" stays true. SRS BR-14, BR-15: N/A, not touched. Sprint 2 contract 222 (Operator item shape) is superseded by the F-02 revision and not rewritten; 847 (DEC-29, "10 lines × 10 × price") stays a valid upper bound because the database still allows 10. Sprint 3 contract: no per-line limit statement found by search |
| Seed and fixtures | N/A for the seed | The seed stores no quantity above 1 (`prisma/seed.ts` 253) and no menu response field |
| Known limitation | Recorded | The cap is per line of one order. A customer can place several orders, each capped against the remaining stock (DEC-65) |

## 3. Must remain unchanged

| Behaviour | Protected by |
|---|---|
| 1 to 10 lines per order; no duplicate item (`validate.ts` 31, 41-54) | AC-19 / TEST-19 (`orders.create.test.ts` 180-220; `orderRules.test.ts` 45-62) |
| `ITEM_UNAVAILABLE` precedence: disabled, stock 0, or quantity above stock (for a quantity of 1 to 5) | TEST-21; TEST-22 (stock 3, quantity 4, `orders.create.test.ts` 275-302); TEST-24; TEST-49 |
| All-or-nothing order (BR-02) | TEST-22 |
| Server-side total and price rejection (BR-03) | TEST-15, TEST-16, TEST-17 |
| No oversell, stock never below 0 (BR-05); stock restored once on cancel and reject | TEST-23, TEST-24, TEST-46, TEST-59, TEST-94 |
| Ownership: another customer's order is 403 (BR-07) | TEST-27, TEST-28, TEST-39, TEST-65, TEST-74 |
| Role guards (401, 403) and the route table (R-01) | TEST-26, TEST-37, TEST-38, TEST-43, TEST-55, TEST-90 to TEST-92 |
| A 409 keeps the cart lines and pickup note and does not navigate; the menu reloads | TEST-30, the FND-02 case in `Menu.test.tsx` 177-240, E2E `AC-21 / AC-30` assertions |
| Database `CHECK` 1..10 | `constraints.test.ts` 105-129 (rejects 0 and 11) |

## 4. Regression suites and commands

Commands as written in the root `package.json` and `.github/workflows/ci.yml`. None was run for this analysis. Backend tests and Playwright share `campusbites_test` and must run one after another (DEC-26).

| Step | Command | Source |
|---|---|---|
| Install | `npm ci` | `ci.yml` |
| Backend unit and API tests with the 85% service coverage gate (COV-01) | `npm run coverage --workspace=backend` | `ci.yml`, `ci-docker.yml` |
| Frontend unit and component tests | `npm test --workspace=frontend` | `ci.yml`, `ci-docker.yml` |
| Playwright browser | `npx playwright install chromium` (in `frontend/`) | `ci.yml` |
| End-to-end | `npm run e2e` | `ci.yml` |
| Type check (both workspaces) | `npm run typecheck` | root `package.json` (local; not a `ci.yml` step) |
| Production build | `npm run build` | root `package.json` (local; `ci-docker.yml` runs `npm run build --workspace=frontend`) |

**Run the type check by hand for CR-01.** A pull request into `sprint-3-staging` gets `ci.yml` only (`ci-docker.yml` does not list the branch, DEC-57), and `ci.yml` has no type-check or build step. `frontend/tsconfig.json` includes `src`, so test fixtures are type-checked. Vitest does not type-check them.

## 5. Existing tests whose expected result or input legitimately changes

These follow from the requirement change. Each updates a pinned value; no assertion is removed or loosened (same convention as CHG-04 and DEC-45). **Read, not run: to be confirmed in #78.** If #78 finds another test that must change, it is added to the contract revision first.

| Test and location | Old → new | Reason | Fails if left unchanged? |
|---|---|---|---|
| TEST-10, first case, `backend/tests/menu.test.ts` 29-31 | Exact keys `available, description, id, isAvailable, name, priceSatang, stockQty` → the same 7 plus `maxOrderQuantity` | AC-10 revised (DEC-62) | Yes, expected from the exact key comparison |
| TEST-18 (unit), `backend/src/services/orderRules.test.ts` 40 | Rejected `0, -1, 1.5, "2", 11` → `0, -1, 1.5, "2", 6, 11` | AC-18: "above 10" → "above 5" | **No.** 11 is still rejected. Adding 6 tests the new boundary |
| TEST-18 (API), `backend/tests/orders.create.test.ts` 168 | Same list change | Same | **No**, same reason |
| `Menu.test.tsx` 251-287, "Follow-up 5 … stockQty is below 10" (no TEST ID) | Item stock 2: one press of + gives card quantity 2, + disabled, cart + disabled → `maxOrderQuantity` 1: card quantity stays 1, + disabled at once, Add puts 1 in the cart, cart + disabled. Title wording follows | Maximum at stock 2 is 1 (DEC-58, DEC-63) | Yes, expected |
| Menu item objects in `Menu.test.tsx` 26-45, 121-129, 178-192, 254-262, 293-300, 326-335 | No `maxOrderQuantity` → stock 30 → 5; 50 → 5; 0 → 0; 1 → 1; 2 → 1 | The field becomes required in `MenuItem`; without it the selector has no maximum | Type check: expected. Run time: to be confirmed. Assertions of the other cases in this file stay the same |
| Menu item objects in `OperatorMenu.test.tsx` 15-34 (`SAMPLE_ITEMS`), 101-109 (`createdItem`) | No field → stock 15 → 5; disabled, stock 0 → 0; stock 10 → 5 | Same type change. TEST-56 assertions stay the same; the create and PATCH payloads (113-120, 145-147) must not gain the field | Type check: expected |
| E2E `AC-21 / AC-30`, `frontend/e2e/order.spec.ts` 127-136 | Chunk `Math.min(10, remaining)` → `Math.min(5, Math.max(1, Math.floor(remaining / 2)))`; comment 127 follows. Every chunk still expects 201; other assertions unchanged | DEC-27 revised by DEC-66 | **Not necessarily.** The test picks the smallest positive stock and the seed has an item with stock 1, where both rules give a chunk of 1. The old code fails only when the chosen stock is 3 or more |

**Read and not expected to change** (do not edit these for CR-01):

| Test | Why |
|---|---|
| TEST-22 | Stock 3, quantity 4 is above stock, so `ITEM_UNAVAILABLE` still wins. Its second call orders 1 unit at stock 3 (maximum 1), so only the sold-out line fails |
| TEST-24 | Stock 1, two orders of 1: maximum 1; the loser sees stock 0 |
| TEST-19; `orderRules.test.ts` 28-38 and 45-95 | No quantity above 2 |
| TEST-47, TEST-48 (Operator create and update responses) | They use `toMatchObject` (`menuItems.test.ts` 51-58, 92-99, 107-114), so an extra field is allowed. TEST-55 compares database rows |
| TEST-10 other cases (`menu.test.ts` 48-116), TEST-11 | No key-set comparison of items; `isOrderable` unchanged |
| TEST-13, TEST-30, FND-02 component case, `Menu.test.tsx` 242-249 and 289-371 | Same expected results once fixtures carry the field |
| TEST-29 (`order.spec.ts` 25-69) | 2 units at stock 30 is within the maximum |
| Other order tests (`orders.cancel`, `orders.reject`, `orders.pay`, `orders.fulfilment`, `orders.journey`, `orders.access`, `orders.operator`, `routes.access`, `menuItems`) | The multi-unit orders read use quantity 2 or 3 on stock 20 or more |
| `constraints.test.ts` cases 4 and 5 | The `CHECK` is unchanged |

## 6. New verification

New criteria AC-148 to AC-160 and tests TEST-148 to TEST-160 are defined in S1, F-02 and F-03 "Revision 1.4 (CR-01)". All are **NOT RUN** and unimplemented (`docs/traceability.md`).
