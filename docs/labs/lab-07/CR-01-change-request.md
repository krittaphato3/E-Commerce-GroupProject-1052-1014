# Omazon — CR-01 Change Request: Stock-Aware Per-Line Quantity Cap (BR-01 + BR-02)

| Item | Value |
|---|---|
| Document | `docs/labs/lab-07/CR-01-change-request.md` |
| Course / Lab | CPE 334, Lab 7 |
| Change request | CR-01, register ID CHG-07 |
| Issue | [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76) |
| Version | 2.0 |
| Date | 2026-11-28 |
| Status | **PROPOSED, team approval pending** (§11) |
| Evidence | EV-CR01-01, EV-CR01-02 (§2) |
| Related | `docs/change-register.md`, `docs/srs.md`, `docs/features.md`, `docs/system-sds.md`, `docs/traceability.md`, `docs/sprints/sprint-1/features.md` |

### Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-11-28 | napatsun | Initial change request record with baseline evidence EV-CR01-01 (Issue #76) |
| 1.1 | 2026-11-28 | napatsun | Synced with the revised body of Issue #76: SRS version citation; one affected AC and test statement; draft table reduced to D-1 to D-5 and the outdated numbering note removed; database constraint restated as "Known impact". Still PROPOSED |
| 2.0 | 2026-11-28 | napatsun | **Supersedes 1.x.** Following the instructor announcement of 24 Nov 2026 (§11), the change must be complex enough and instructor/TA approval is not required. The earlier "10 → 5" per-line cap proposal was judged trivial and is replaced by a stock-aware per-line cap. New evidence EV-CR01-02. The 1.x text remains in Git history |

This record proposes a change. It does not change any requirement, contract, test or source file.

## 1. Type

**Adaptive maintenance.** The requirement changes. The Sprint 1 behaviour is correct against its accepted requirements BR-01 and BR-02. CR-01 is therefore **not a defect fix**.

This differs from the corrective maintenance of Lab 6, where software that did not behave as agreed was fixed against an unchanged requirement.

## 2. Original requirement and implemented rule

| Item | Value |
|---|---|
| Business rules | BR-01 (quantity and lines), BR-02 (availability and all-or-nothing) |
| Features | F-02, Menu browsing (defines the availability rule); F-03, Order submission (enforces it). Both accepted in `sprint-1-v1.0` |
| Functional requirement | FR-05 (a Customer submits an order with items, quantities and an optional pickup note) |
| SRS version | v1.13 at `d85f1be` (v1.12 at `sprint-1-v1.0`) |

**Verbatim from `docs/srs.md`** (same wording at `858ef85` lines 84-85 and `d85f1be` lines 99-100):

> **BR-01:** Each order line has an integer quantity from 1 to 10. An order has 1 to 10 lines, and no menu item appears twice in one order.
>
> **BR-02:** An item can be ordered only if it is enabled and its stock is at least the requested quantity. If any line fails, the whole order is rejected and nothing is saved.

The per-line upper limit is **static**: it does not depend on stock.

**Related criteria** (`docs/sprints/sprint-1/features.md`, same lines at both versions):

| AC | Line | Wording | Effect of CR-01 |
|---|---|---|---|
| AC-10 | 314 | An anonymous `GET /api/menu` returns 200 with all seeded items, each with `id`, `name`, `description`, `priceSatang` (integer), `stockQty` and `available`, ordered by `id`. | Affected if the menu response gains a field |
| AC-11 | 315 | `available` is `false` when `isAvailable` is false or `stockQty` is 0, and `true` only when both `isAvailable` is true and `stockQty` is above 0. | Unchanged |
| AC-18 | 459 | A quantity of 0, a negative number, a decimal, a string or a value above 10 returns 400; no order is saved. | Revised: "above 10" |
| AC-19 | 460 | An empty item list, more than 10 lines, or the same `menuItemId` twice returns 400; no order is saved. | **Unchanged** (regression protection) |
| AC-21 | 462 | Ordering a disabled item or an item with stock 0 returns 409 `ITEM_UNAVAILABLE`; no order is saved and stock is unchanged. | Unchanged |
| AC-22 | 463 | Ordering more than the available stock returns 409. When one line of a multi-line order fails, **no** line is applied: stock of the other lines is unchanged and no order exists. | Wording can stand; TEST-22 depends on the error precedence (§6.2) |
| AC-24 | 465 | When two customers simultaneously order the last unit of an item, exactly one request succeeds with 201 and the other returns 409; stock ends at 0 (never negative) and only one order contains the item. | Unchanged (regression protection) |

**Traceability rows** (`docs/traceability.md` lines 68-69 at `858ef85`, lines 80-81 at `d85f1be`):

```text
| BR-01 | F-03 | 1 | AC-18, AC-19 | TEST-18, 19 | backend/src/services/orderRules.test.ts::TEST-18; backend/tests/orders.create.test.ts::TEST-18, ::TEST-19 | PASS | 140c030 (red), 0f3c649 (green) |
| BR-02 | F-02 (defines), F-03 (enforces) | 1 | AC-11, AC-21, AC-22 | TEST-11, 21, 22 | backend/src/services/menuRules.test.ts::TEST-11; backend/tests/orders.create.test.ts::TEST-21, ::TEST-22 | PASS | 140c030 (red), 0f3c649 (green) |
```

`PASS` is the recorded status. No test was run for this record.

**Evidence.**
- **EV-CR01-01:** [`CR-01-BASELINE-858ef85-d85f1be.txt`](../../evidence/CR-01-BASELINE-858ef85-d85f1be.txt), the static limit. Captured for the 1.x proposal and not modified.
- **EV-CR01-02:** [`CR-01-BASELINE-STOCKAWARE-858ef85-d85f1be.txt`](../../evidence/CR-01-BASELINE-STOCKAWARE-858ef85-d85f1be.txt), the order transaction, availability rule, menu response, error codes, UI and tests at both versions.

### 2.1 Implemented behaviour (line numbers at `d85f1be`)

**Request validation**, `backend/src/middleware/validate.ts` (same lines at `858ef85`):

```ts
23:    // BR-01: integer quantity from 1 to 10, never a string or a decimal.
24:    quantity: z.number().int().min(1).max(10),
...
31:    items: z.array(orderItemSchema).min(1).max(10),
```

**Stock reservation**, `backend/src/services/orderService.ts` (`reserveStock`; lines 109-155 at `858ef85`, 232-278 at `d85f1be`):

```ts
241:  const rows = await tx.$queryRaw<StockRow[]>`
242:    UPDATE "MenuItem"
243:       SET "stockQty" = "stockQty" - ${quantity}::int,
244:           "updatedAt" = NOW()
245:     WHERE "id" = ${menuItemId}::int
246:       AND "isAvailable" = true
247:       AND "stockQty" >= ${quantity}::int
248:    RETURNING "name", "priceSatang"
249:  `;
250:
251:  if (rows.length === 0) {
252:    const item = await tx.menuItem.findUnique({
...
258:    const available = item && isOrderable({ isAvailable: item.isAvailable, stockQty }, 1)
...
270:    throw new AppError(409, "ITEM_UNAVAILABLE", message, {
271:      menuItemId,
272:      requested: quantity,
273:      available,
274:    });
```

**There is no stock read or separate availability check before the decrement.** One conditional `UPDATE` both checks and reserves. `stockQty` is read, and `isOrderable` is called, only after the update matched no row, to build the error. `create` runs `reserveStock` for each line, in ascending `menuItemId` order, inside one `prisma.$transaction` (lines 298-339), so a failing line rolls back the whole order. No isolation level is set in the code.

**Availability rule**, `backend/src/services/menuRules.ts` lines 10-11 (same at both versions):

```ts
10: export function isOrderable(item: AvailabilityItem, quantity: number): boolean {
11:   return item.isAvailable === true && quantity > 0 && item.stockQty >= quantity;
```

`backend/src/services/orderRules.ts` has no quantity or line rule: it calculates the total and formats the order number.

**Menu response**, `backend/src/services/menuService.ts`: each item is the stored fields plus `available: isOrderable(item, 1)`. At `d85f1be`, `toMenuViewItem` (lines 11-16) serves `GET /api/menu` **and** the Operator create and update responses (lines 36, 43, 53). At `858ef85` the same flag is computed inside `list()` (line 15).

**Error codes.** Codes are string literals passed to `AppError`; there is no central list in the code. `ITEM_UNAVAILABLE` and `VALIDATION_ERROR` exist. A search of both versions finds no `QUANTITY_LIMIT_EXCEEDED`, `maxOrderQuantity` or `allowedMax` (EV-CR01-02 §1.5 and §2.5). `docs/system-sds.md` has the documented error table (`ITEM_UNAVAILABLE` at line 250).

**UI**, `frontend/src/pages/Menu.tsx`:

```ts
 9: const MAX_LINE_QUANTITY = 10;
...
67:    (stockQty: number) => Math.min(MAX_LINE_QUANTITY, Math.max(0, stockQty)),
```

`MAX_LINE_QUANTITY` is also the fallback when a cart item is not in the loaded menu (lines 114 and 281). On any 409, the screen shows `error.message`, keeps the cart and reloads the menu (lines 146-160). It does not display `error.details`.

## 3. Proposed new rule

> **Maximum quantity per line = `min(5, max(1, floor(stockQty / 2)))`**, where `stockQty` is the item's stock read inside the order transaction, before the decrement.

- The formula applies to an orderable item (enabled, stock at least 1). Evaluated alone it gives 1 for stock 0, so BR-02 must still reject stock 0.
- Lines per order stay 1 to 10, and duplicate items stay forbidden.
- If any line exceeds its allowed maximum, the whole order is rejected and nothing is saved, the same all-or-nothing behaviour as BR-02.
- Unchanged: BR-03 pricing, BR-05 atomic reservation, BR-07 ownership, R-01 access.

| Stock before the order | `floor(stock / 2)` | Allowed maximum per line |
|---|---|---|
| 12 | 6 | 5 |
| 10 | 5 | 5 |
| 8 | 4 | 4 |
| 4 | 2 | 2 |
| 3 | 1 | 1 |
| 2 | 1 | 1 |
| 1 | 0 | 1 (the last unit can always be bought) |
| 0 | n/a | Not orderable: existing BR-02 behaviour, 409 `ITEM_UNAVAILABLE`, unchanged |

## 4. Reason

Stop one customer from taking most of a low-stock item, so that more customers can order it.

This is a **synthetic business request** created for the Lab 7 scenario. It is not based on usage data or a real stakeholder.

**Limit of this rule:** the cap applies to one line of one order. It does not stop a customer from placing several orders in a row; each is capped against the stock then remaining. A per-customer limit is not part of CR-01.

## 5. Scope

| In scope | Out of scope (unchanged) |
|---|---|
| Static per-line ceiling of 5 in request validation | Lines per order (1 to 10) and the no-duplicate-item rule (AC-19) |
| Stock-aware maximum in order submission | BR-03 server-side pricing |
| New error code for a quantity above the stock-aware maximum | BR-05 atomic reservation (must be preserved) |
| Per-item maximum in the menu API, used by the UI selector | BR-07 ownership and R-01 access |
| Affected tests, including concurrency | BR-13 catalog limits |
| SRS, SDS, AC, STS and traceability wording | A per-customer or per-period purchase limit |

## 6. Proposed behaviour and design points

### 6.1 Errors and API (final wording and decision in #77)

| Case | Proposed response |
|---|---|
| Quantity above the static ceiling of 5, or invalid (0, negative, decimal, string) | 400 `VALIDATION_ERROR` from request validation |
| Quantity from 1 to 5 but above the stock-aware maximum | 409 `QUANTITY_LIMIT_EXCEEDED` (new code), with a detail giving the item id and `allowedMax` |
| Disabled item or stock 0 | 409 `ITEM_UNAVAILABLE` (unchanged) |

- The stock-aware part cannot live in the zod schema, which cannot see stock. It belongs in `orderService`, inside the order transaction.
- The rule should be a pure function in the services layer so that it can be unit-tested. `isOrderable` is in `menuRules.ts`; #77 chooses between that file and `orderRules.ts`.
- The menu API should expose a per-item `maxOrderQuantity`, so the UI does not repeat the business rule. The selector maximum becomes that value instead of `Math.min(MAX_LINE_QUANTITY, stockQty)`.
- A customer whose cart became invalid because stock changed is shown the `allowedMax` from the 409.

### 6.2 Open points found in the code (decide in #77)

1. **The reservation has to be redesigned, and a transaction alone is not enough.** The rule needs the stock before the decrement, which today's single `UPDATE` never reads. A plain read, then the check, then the `UPDATE`, inside the current transaction, can race: with no isolation level set, the database default applies (PostgreSQL's default is Read Committed; the deployed setting was not checked), and another order can change the stock between the read and the update. The `stockQty >=` condition would still stop negative stock, but not a quantity above the new cap. Two candidate designs:
   - lock the row (`SELECT ... FOR UPDATE`), apply the pure function, then decrement, keeping the ascending `menuItemId` lock order; or
   - put the cap into the `UPDATE ... WHERE` condition, which keeps one statement but repeats the formula in SQL.
2. **Which error wins when both rules fail.** Stock 3 with quantity 4 breaks BR-02 (4 > 3) and the new cap (4 > 1). **TEST-22 sends exactly this request** and expects `ITEM_UNAVAILABLE` (`orders.create.test.ts` lines 280-286). Applying the §6.1 table literally gives `QUANTITY_LIMIT_EXCEEDED` and changes TEST-22. Checking BR-02 first (disabled or stock below the request) keeps it, but its message reports the stock ("has only 3 left"), which can exceed the allowed maximum.
3. **`maxOrderQuantity` for a disabled or sold-out item.** The formula alone gives 1 for stock 0. A value of 0 would be consistent with "not orderable".
4. **Menu response shape.** TEST-10 asserts the exact key set of `GET /api/menu` (`menu.test.ts` lines 29-31), so adding a field changes TEST-10 and AC-10. Because `toMenuViewItem` is shared, the Operator create and update responses also gain the field unless it is split.
5. **Showing `allowedMax` in the UI.** The screen shows only the error message, so the message must contain the number or the UI must read `details`. After the menu reloads, existing cart lines are not reduced until the customer presses + or − or adds the item again. #77 also decides what replaces the `MAX_LINE_QUANTITY` fallback.
6. **E2E buy-out (DEC-27).** `order.spec.ts` buys all remaining stock in chunks of `Math.min(10, remaining)`. A constant chunk of 5 is **not** enough, because the cap shrinks with the stock: each chunk must be at most the allowed maximum for the current `remaining`. From 30 the chunks are 5, 5, 5, 5, 5, 2, 1, 1, 1. The test picks the item with the smallest positive stock, and the demo fixtures include one with stock 1, so it could pass without exercising this; not run.

## 7. Draft acceptance criteria

> **DRAFT.** Temporary IDs D-1 to D-9. Final numbering and AC and STS wording are done in [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77). AC-19, the lines-per-order and duplicate-item rule, is unchanged. "Stock N" is the stock before each request shown; each request starts from that stock.

| Draft ID | Given / When | Then |
|---|---|---|
| D-1 | Stock 10, one line of quantity 5 | 201, stock becomes 5 |
| D-2 | Stock 10, quantity 6 | 400 `VALIDATION_ERROR` (static ceiling), nothing saved, stock unchanged |
| D-3 | Stock 4: quantity 2; quantity 3 | Quantity 2: 201. Quantity 3: 409 `QUANTITY_LIMIT_EXCEEDED`, nothing saved, stock unchanged |
| D-4 | Stock 3: quantity 1; quantity 2 | Quantity 1: 201. Quantity 2: 409 `QUANTITY_LIMIT_EXCEEDED` (`floor(3/2) = 1`) |
| D-5 | Stock 1, quantity 1; stock 0 | Stock 1: 201 (last unit allowed). Stock 0: existing 409 `ITEM_UNAVAILABLE` (unchanged) |
| D-6 | A multi-line order in which one line violates its maximum | Whole order rejected, other lines' stock unchanged, nothing saved |
| D-7 | Concurrency (BR-05 preserved): two customers order the last units at the same time | Stock never goes below 0, and the stock-aware cap holds for each |
| D-8 | The menu shows an item | UI quantity selector maximum equals the allowed maximum from the API |
| D-9 | Quantity 0, negative, decimal or string; a 10-line order with every line within its maximum | Invalid quantity: 400 (unchanged). 10-line order: accepted (unchanged) |

A suggested D-7 case for #77: stock 4, two customers each order 2 at the same time. Expected: one 201; the other 409 `QUANTITY_LIMIT_EXCEEDED`, because the allowed maximum is 1 once stock is 2; final stock 2. A read-then-update design (§6.2 point 1) could accept both. With stock 1 and two orders of 1, the existing TEST-24 outcome (one 201, one 409 `ITEM_UNAVAILABLE`) should stay.

## 8. Invalid cases, access and historical data

Invalid quantities and over-limit lines are D-2 to D-6 and D-9.

| Case | Expectation | Change |
|---|---|---|
| Who may submit an order | Only an authenticated Customer | Unchanged (R-01) |
| Unauthenticated `POST /api/orders` | 401 `UNAUTHENTICATED` | Unchanged (R-01) |
| Operator `POST /api/orders` | 403 `FORBIDDEN` | Unchanged (R-01) |
| Ownership and isolation | A Customer accesses only their own orders; Operators access all orders | Unchanged (BR-07) |
| Existing orders with a line quantity of 6 to 10 | Stay valid and readable | No data migration proposed |

**Database constraint.** `OrderItem_quantity_check CHECK (quantity 1..10)` in `backend/prisma/migrations/20261105161538_0001_init/migration.sql:124` is proposed to stay, so that historical orders with a line quantity of 6 to 10 remain valid and no data migration is needed. The database then no longer enforces the new upper limit by itself (neither the ceiling of 5 nor the stock-aware maximum), and the SDS has to say so. The final decision is made in #77.

**The no-migration conclusion comes from reading the code and has not been tested.** Request validation applies to the body of `POST /api/orders` only (EV-CR01-01 §4), so stored lines are not re-validated by it. Cancel and reject return the stored quantity to stock. No test with stored quantities of 6 to 10 under the new rule has been run, and the deployed data was not queried.

## 9. Complexity

| Layer | Change |
|---|---|
| Request validation | Static ceiling 10 → 5 |
| `orderService` transaction | The single conditional `UPDATE` must also enforce a stock-dependent maximum without a race |
| Domain rule | New pure function for the allowed maximum |
| Error contract | New code `QUANTITY_LIMIT_EXCEEDED` with item id and `allowedMax`, and a precedence rule against `ITEM_UNAVAILABLE` |
| Menu API | New per-item `maxOrderQuantity` |
| UI | Selector and cart use the API value; the 409 shows `allowedMax` |
| Database | Decision on the `CHECK` constraint and on historical data |
| Tests | Unit, API, all-or-nothing, concurrency, component and E2E (DEC-27) |

## 10. Impact starting point for #77

From a search and reading of `d85f1be`. **Nothing was modified.** It is a starting point, not the finished impact analysis.

| Area | Location | Why |
|---|---|---|
| Validation | `backend/src/middleware/validate.ts` lines 23-24 | Ceiling 10 → 5 |
| Order transaction | `backend/src/services/orderService.ts` lines 236-278, 298-339 | Stock-aware maximum, new error, race safety |
| Rule | `backend/src/services/menuRules.ts` or `orderRules.ts` | New pure function |
| Menu API | `backend/src/services/menuService.ts` lines 7-16, 36, 43, 53 | `maxOrderQuantity` |
| UI | `frontend/src/pages/Menu.tsx` lines 9, 66-69, 74, 86, 114, 146-160, 248, 281, 304; `frontend/src/api/menu.ts` lines 3-11 | API value, new error, type |
| Database | `0001_init/migration.sql` line 124 | Keep or change the `CHECK` |
| TEST-18 | `orderRules.test.ts` line 40; `orders.create.test.ts` line 168 | Rejected values include 11 but not 6 |
| TEST-22 | `orders.create.test.ts` lines 280-286 | Depends on error precedence |
| TEST-10 | `backend/tests/menu.test.ts` lines 29-31 | Exact menu key set |
| Component tests | `Menu.test.tsx` lines 251-287 | Expects a selector maximum of 2 at stock 2; the new maximum is 1 |
| Test fixtures | Menu item objects in `Menu.test.tsx` and `OperatorMenu.test.tsx` | Need the new field if the type requires it |
| E2E | `frontend/e2e/order.spec.ts` lines 127-135 | DEC-27 chunking (§6.2 point 6) |
| Database test | `backend/tests/constraints.test.ts` lines 105, 118-129 | Unchanged if the `CHECK` stays |
| SRS | `docs/srs.md` lines 99-100 (BR-01, BR-02), 215 (DEC-27) | Rule wording |
| SDS | `docs/system-sds.md` lines 72-73, 76, 139, 161, 223, 250 | Enforcement, `CHECK`, client check, error table. Line 76 says conditional `updateMany`; the code uses a raw `UPDATE` |
| Sprint 1 contract | `docs/sprints/sprint-1/features.md` lines 291, 314, 323, 373, 380, 387, 421, 459, 482, 486 | Menu response, AC-10, TEST-10, rules, fields, errors, AC-18, TEST-18, TEST-22 |
| Sprint 2 contract | `docs/sprints/sprint-2/features.md` lines 222, 847 | Operator item shape; DEC-29 uses "10 lines × 10 × price" |
| Features and traceability | `docs/features.md` lines 29-30; `docs/traceability.md` lines 80-81 | F-02, F-03, BR-01, BR-02 rows |

Existing backend tests that order more than one unit: apart from TEST-22, the stock setups read use items with stock of 20 or more, where the allowed maximum is 5 and the quantities are 2 or 3 (EV-CR01-02 §3). This was not confirmed by running the tests. A search found no seed or benchmark order above quantity 1.

Must **not** change: `validate.ts` line 31, AC-19, TEST-19 and the 11-line test cases.

## 11. Approval

| Field | Value |
|---|---|
| Instructor/TA approval | Not required (announcement below) |
| Team approval | ____ (teammate), ____ (date); recorded as a comment on Issue [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76) |
| Status | **PROPOSED, team approval pending** |

**Evidence of announcement:** Instructor announcement dated 24 Nov 2026: 'Lab 7 Spec Sheet Change. You need not get Instructor or TA Approval for your change request to Sprint 1. Think of a good change to Sprint 1 among yourselves, but do try to make it a complex enough added feature and not just a trivial change.'

[screenshot/link to be attached by the team]

## 12. Versions

| Item | Ref | Note |
|---|---|---|
| Accepted Sprint 1 baseline | `sprint-1-v1.0` (`858ef85`) | The release in which F-02 and F-03 were accepted |
| Actual pre-change implementation | `main` @ `d85f1be` (deployed) | Deployment check: `docs/evidence/POSTDEPLOY-d85f1be.txt` |
| Code-identical staging tip | `sprint-3-staging` @ `36a04b3` | Differs from `d85f1be` only by `docs/evidence/POSTDEPLOY-d85f1be.txt` |

Development between `858ef85` and `d85f1be` (including F-05 to F-09, R-05 and the Deliverable 2 documents) is unrelated to CR-01. BR-01, BR-02, the static limit, the conditional `UPDATE`, `isOrderable` and the UI cap are the same at both versions. Surrounding files changed, including the shared `toMenuViewItem` helper added with Operator catalog writes.

## 13. Related issues

| Issue | Scope |
|---|---|
| [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77) | Impact analysis and contract revision |
| [#78](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/78) | Test-first implementation, regression and release |
| [#79](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/79) | Lab 7 metrics, readiness and report |
