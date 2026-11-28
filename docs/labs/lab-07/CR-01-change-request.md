# Omazon — CR-01 Change Request: BR-01 Line Quantity Cap 10 → 5

| Item | Value |
|---|---|
| Document | `docs/labs/lab-07/CR-01-change-request.md` |
| Course / Lab | CPE 334, Lab 7 |
| Change request | CR-01, register ID CHG-07 |
| Issue | [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76) |
| Version | 1.1 |
| Date | 2026-11-28 |
| Status | **PROPOSED, awaiting approval** (§10) |
| Related | `docs/change-register.md`, `docs/srs.md`, `docs/traceability.md`, `docs/sprints/sprint-1/features.md`, `docs/evidence/CR-01-BASELINE-858ef85-d85f1be.txt` |

### Revision history
| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 2026-11-28 | napatsun | Initial change request record with baseline evidence EV-CR01-01 (Issue #76) |
| 1.1 | 2026-11-28 | napatsun | Synced with the revised body of Issue #76: SRS version citation; one affected AC and test statement; draft table reduced to D-1 to D-5 and the outdated numbering note removed; database constraint restated as "Known impact" (§6.1). Still PROPOSED |

This record proposes a change. It does not change any requirement, contract, test or source file.

## 1. Type

**Adaptive maintenance.** The requirement changes. The Sprint 1 behaviour is correct against its accepted requirement: a quantity of 1 to 10 per line is what BR-01 specifies. CR-01 is therefore **not a defect fix**.

This differs from the corrective maintenance of Lab 6, where software that did not behave as agreed was fixed against an unchanged requirement.

## 2. Original requirement and implemented rule

| Item | Value |
|---|---|
| Business rule | BR-01 (`docs/srs.md`, enforced by "Service + schema validation", Sprint 1) |
| Feature | F-03, Order submission and customer order views (accepted in `sprint-1-v1.0`) |
| Functional requirement | FR-05 (a Customer submits an order with items, quantities and an optional pickup note) |
| Affected acceptance criteria / tests | AC-18 / TEST-18 revised; AC-19 / TEST-19 unchanged (regression protection) |

**BR-01, verbatim from `docs/srs.md`** (same wording at `858ef85` line 84 and `d85f1be` line 99):

> Each order line has an integer quantity from 1 to 10. An order has 1 to 10 lines, and no menu item appears twice in one order.

This record cites SRS v1.13 at `d85f1be` (v1.12 at `sprint-1-v1.0`), as given in the SRS document header at each version.

**AC-18 and AC-19, verbatim** (`docs/sprints/sprint-1/features.md` lines 459 and 460 at both versions):

| AC | Wording | Affected by CR-01 |
|---|---|---|
| AC-18 | A quantity of 0, a negative number, a decimal, a string or a value above 10 returns 400; no order is saved. | Yes: "above 10" |
| AC-19 | An empty item list, more than 10 lines, or the same `menuItemId` twice returns 400; no order is saved. | No change to the rule: it covers lines per order and duplicates |

TEST-18 posts quantities `0, -1, 1.5, "2", 11` (unit and integration). TEST-19 posts an empty list, 11 distinct lines, and one item listed twice (integration).

**Traceability row** (`docs/traceability.md` line 68 at `858ef85`, line 80 at `d85f1be`; identical text):

```text
| BR-01 | F-03 | 1 | AC-18, AC-19 | TEST-18, 19 | backend/src/services/orderRules.test.ts::TEST-18; backend/tests/orders.create.test.ts::TEST-18, ::TEST-19 | PASS | 140c030 (red), 0f3c649 (green) |
```

The row is quoted as it stands and links BR-01 to both criteria. For CR-01: AC-18 / TEST-18 revised; AC-19 / TEST-19 unchanged (regression protection).

`PASS` is the status recorded in that row. The tests were not re-run for this record.

### 2.1 Code locations (evidence EV-CR01-01)

EV-CR01-01 is [`docs/evidence/CR-01-BASELINE-858ef85-d85f1be.txt`](../../evidence/CR-01-BASELINE-858ef85-d85f1be.txt): the commands, refs, timestamp and output for both versions.

**Backend**, `backend/src/middleware/validate.ts` (same lines at `858ef85` and `d85f1be`):

```ts
23:    // BR-01: integer quantity from 1 to 10, never a string or a decimal.
24:    quantity: z.number().int().min(1).max(10),
...
30:    // BR-01: 1 to 10 lines.
31:    items: z.array(orderItemSchema).min(1).max(10),
```

Line 24 is the rule that CR-01 changes. Line 31 is the lines-per-order rule, which stays.

**UI**, `frontend/src/pages/Menu.tsx` (same lines at `858ef85` and `d85f1be`):

```ts
 9: const MAX_LINE_QUANTITY = 10;
...
67:    (stockQty: number) => Math.min(MAX_LINE_QUANTITY, Math.max(0, stockQty)),
```

The effective cap is `min(10, stockQty)`, never below 0. `MAX_LINE_QUANTITY` is also the fallback cart cap when the item is not in the loaded menu (line 114 at both versions; also line 273 at `858ef85` and line 281 at `d85f1be`). `LOW_STOCK_THRESHOLD = 10` on line 10 controls the "N left" hint and is not the quantity cap.

**Database**, `backend/prisma/migrations/20261105161538_0001_init/migration.sql` line 124 (both versions). See the known impact in §6.1:

```sql
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" >= 1 AND "quantity" <= 10);
```

## 3. Proposed new rule

**BR-01 (proposed revision):**

> Each order line has an integer quantity from 1 to 5. An order has 1 to 10 lines, and no menu item appears twice in one order.

Only the upper limit of the per-line quantity changes, from 10 to 5.

## 4. Reason

Limit stock-hoarding of low-stock items so that more customers can order popular items.

This is a **synthetic business-owner request** created for the Lab 7 scenario. It is not based on usage data or a real stakeholder.

## 5. Scope

| In scope | Out of scope (unchanged) |
|---|---|
| Per-line quantity cap in backend validation | Lines per order (stays 1 to 10) and the no-duplicate-item rule |
| UI quantity selector | BR-02 availability rule |
| Affected tests | BR-03 server-side pricing |
| SRS, SDS, AC and STS wording | BR-05 stock reservation |
| | BR-13 catalog limits |

## 6. Draft acceptance criteria

> **DRAFT.** Final AC and STS wording, including ID assignment, is done in Issue [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77). The `D-` IDs below are temporary and are the same as in Issue #76.

| Draft ID | Given / When | Then |
|---|---|---|
| D-1 | A Customer submits a line with quantity **5** and stock is sufficient | 201, order created, stock decremented by 5 |
| D-2 | A Customer submits a line with quantity **6** | 400 `VALIDATION_ERROR`, nothing saved, stock unchanged |
| D-3 | A line has quantity 0, a negative number, a decimal or a string | 400 `VALIDATION_ERROR`, nothing saved (unchanged) |
| D-4 | A Customer submits **10 lines**, each with quantity ≤ 5, for distinct items with sufficient stock | Order still accepted (201) |
| D-5 | The menu shows an item | UI quantity selector maximum = `min(5, stockQty)`, on the menu card and in the cart |

Draft IDs; final mapping and ID assignment are done in #77. AC-19 is unchanged by CR-01, and its behaviour must stay covered.

In the accepted contract, invalid per-line quantity belongs to AC-18. AC-19 covers an empty item list, more than 10 lines and a duplicate item (§2).

### 6.1 Known impact: database constraint

**Known impact: database constraint.** `OrderItem_quantity_check CHECK (quantity 1..10)` in `backend/prisma/migrations/20261105161538_0001_init/migration.sql:124` is proposed to stay, so that historical orders with a line quantity of 6–10 remain valid and no data migration is needed. API request validation on order submission enforces the new cap of 5. The database would then no longer enforce the new upper limit by itself, and the SDS has to say so. The final decision is recorded in #77. (The no-migration conclusion comes from reading the code; it has not been tested, and the deployed data was not queried.)

At present, `docs/system-sds.md` states that BR-01 is enforced by the database `CHECK quantity BETWEEN 1 AND 10` as well as by schema validation. A plain `CHECK ... <= 5` would conflict with any existing row that has a quantity of 6 to 10 (§7).

## 7. Invalid cases and access expectations

Invalid quantities are D-2 and D-3. An empty list, more than 10 lines or a duplicated item stay rejected as before (AC-19).

| Case | Expectation | Change |
|---|---|---|
| Who may submit an order | Only an authenticated Customer | Unchanged (R-01) |
| Unauthenticated `POST /api/orders` | 401 `UNAUTHENTICATED` | Unchanged (R-01) |
| Operator `POST /api/orders` | 403 `FORBIDDEN` | Unchanged (R-01) |
| Ownership and isolation | A Customer accesses only their own orders; Operators access all orders | Unchanged (BR-07) |
| Existing orders with a line quantity of 6 to 10 | Stay valid and readable | No data migration |

**Why no data migration is needed.** The rule governs what may be submitted. At `d85f1be`, the schema that holds the cap is applied to the request body of `POST /api/orders` only (`backend/src/routes/orders.ts` line 28; EV-CR01-01 §4), so stored order lines are not re-validated against it. Historical orders record what was allowed when they were placed, and with the database constraint left at 1 to 10 (§6.1) those rows remain valid. Rewriting them would also change recorded quantities and totals.

This comes from reading the code. No test with a stored quantity of 6 to 10 under a cap of 5 has been run, and the deployed data was not queried. Verification belongs to #77 (test design) and #78 (execution).

## 8. Versions

| Item | Ref | Note |
|---|---|---|
| Accepted Sprint 1 baseline | `sprint-1-v1.0` (`858ef85`) | The release in which F-03 was accepted |
| Actual pre-change implementation | `main` @ `d85f1be` (deployed) | Deployment check: `docs/evidence/POSTDEPLOY-d85f1be.txt` |
| Code-identical branch head | `sprint-3-staging` @ `36a04b3` | Differs from `d85f1be` only by `docs/evidence/POSTDEPLOY-d85f1be.txt` |

Development between `858ef85` and `d85f1be` (including F-05 to F-09, R-05 and the Deliverable 2 documents) is **unrelated to CR-01**. The BR-01 wording, the backend rule and the UI cap are the same at both versions (EV-CR01-01 §1 and §2), although the files around them changed.

## 9. Impact starting point for #77

Places at `d85f1be` that hard-code or depend on the per-line limit of 10. **None was modified.** This is a search result to start the impact analysis, not the analysis itself (EV-CR01-01 §3).

| Area | Location | What it holds |
|---|---|---|
| Backend validation | `backend/src/middleware/validate.ts` lines 23-24 | Comment and `.max(10)` |
| Database | `backend/prisma/migrations/20261105161538_0001_init/migration.sql` line 124 | `CHECK` 1..10 (§6.1) |
| UI | `frontend/src/pages/Menu.tsx` line 9, used at lines 67, 114, 281 | `MAX_LINE_QUANTITY = 10` |
| Unit test | `backend/src/services/orderRules.test.ts` line 40 | Rejected values `0, -1, 1.5, "2", 11`; 6 is not covered |
| Integration test | `backend/tests/orders.create.test.ts` line 168 (TEST-18) | Same rejected values |
| Database test | `backend/tests/constraints.test.ts` lines 105, 118-124 | Test names "CHECK quantity 1..10"; inserts 11 |
| E2E | `frontend/e2e/order.spec.ts` lines 127-130 (`AC-21 / AC-30`) | DEC-27 buy-out in chunks of `Math.min(10, remaining)`. A chunk above 5 would get 400. The seed's demo fixtures include an item with stock 1, so the test could keep passing without exercising this; not run |
| Component test | `frontend/src/pages/Menu.test.tsx` line 251 | Title says "when stockQty is below 10"; the search found no assertion of the cap of 10 itself |
| SRS | `docs/srs.md` line 99 (BR-01); line 215 (DEC-27) | Rule text; "BR-01 cap of 10 per line" and `Math.min(10, stockQty)` |
| SDS | `docs/system-sds.md` lines 72, 139, 161, 223 | `CHECK 1..10` and "quantity 1–10" client checks |
| AC and STS | `docs/sprints/sprint-1/features.md` lines 373, 380, 387, 459, 482 | Rule, field table, boundary cases, AC-18, TEST-18 |
| Schema contract | `docs/sprints/sprint-1/features.md` lines 673, 700 | `CHECK` quantity 1 to 10 |
| Related rationale | `docs/sprints/sprint-2/features.md` line 847 (DEC-29) | Price cap reasoning uses "10 lines × 10 × price" |
| Traceability | `docs/traceability.md` line 80 | BR-01 row; status will need new evidence |

Searched with no per-line limit of 10 found:

- **Seeds and benchmark:** `backend/prisma/seed.ts` and `backend/benchmarks/nfr05-load.js` use a quantity of 1.
- **UI text:** no user-visible string in `frontend/src` states the limit; the UI applies it by disabling the increase buttons.

The "1 to 10 lines per order" rule is **not changing**. Its locations must stay at 10, including `validate.ts` line 31, the `items` row at `docs/sprints/sprint-1/features.md` line 378, AC-19, TEST-19 and the 11-line cases in both backend test files.

## 10. Approval

| Field | Value |
|---|---|
| Approver (instructor/TA) | ____ |
| Date | ____ |
| Link | Comment on Issue [#76](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/76): ____ |
| Status | **PROPOSED, awaiting approval** |

**No contract work (#77) or implementation work (#78) starts before approval is recorded.**

## 11. Related issues

| Issue | Scope |
|---|---|
| [#77](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/77) | Impact analysis and contract revision |
| [#78](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/78) | Test-first implementation, regression and release |
| [#79](https://github.com/krittaphato3/E-Commerce-GroupProject-1052-1014/issues/79) | Lab 7 metrics, readiness and report |
