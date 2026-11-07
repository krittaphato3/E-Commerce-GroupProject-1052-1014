# Omazon — Sprint 1 Evidence Pack (Deliverable 1, Part F)

| Item | Value |
|---|---|
| Document | `docs/evidence/README.md` |
| Sprint | 1 (Deliverable 1) |
| Date | 2026-11-07 |
| Related | `docs/traceability.md`, `docs/sprints/sprint-1/features.md` §6, `docs/deliverable-1/Deliverable-1.docx` |

This directory holds the evidence that the Sprint 1 requirements were met by running the product, not by assertion. File names carry the feature or responsibility they support (`F-01` to `F-04`, `R-01`), and terminal logs carry the tested commit hash in their file name.

## 1. Screenshot evidence — required flows

The seven flows required by the Sprint 1 deliverable, captured from the running application:

| # | Required flow | AC | File | What the screenshot shows |
|---|---|---|---|---|
| 1 | Login page and validation | AC-02, AC-04, AC-09 | `F-01-login-failure.png` | Login form with the generic "Invalid email or password." alert. The message does not reveal whether the email exists |
| 2 | Menu browsing, available and sold out | AC-10, AC-12 | `F-01-customer-menu.png` | Desktop menu with THB prices, a "1 left" stock hint, "Sold out" badges on Chicken Sandwich and Pad Thai, and the cart panel |
| 2 | Menu browsing (mobile width) | AC-10, AC-12 | `F-02-menu-sold-out-badge.png` | Narrow-viewport menu showing the sold-out badge and the low-stock hint |
| 2 | Menu browsing (mobile, continued) | AC-10, AC-12 | `F-02-menu-sold-out.png` | Same narrow viewport scrolled past the sold-out cards; shows the empty cart state |
| 3 | Cart before confirmation | AC-14, AC-15 | `F-03-cart-filled.png` | Cart with two lines, per-line totals, estimated total `฿150.00` and a pickup note |
| 3 | Order confirmation | AC-14, AC-29 | `F-03-order-detail.png` | The order detail shown immediately after placing: `CB-000002`, `Pending`, `Unpaid`, line items, total, pickup note, first history entry |
| 4 | Customer order detail (`PENDING`) | AC-14, AC-25, AC-29 | `F-03-order-detail.png` | Same screen: status badge, server-calculated total and the `Order placed` history row with actor `CUSTOMER` and timestamp |
| 5 | Operator orders dashboard (oldest first) | AC-32, AC-33 | `F-01-operator-orders.png` | Operator "Incoming orders" table with the status filter and order `CB-000001` awaiting action |
| 6 | Operator order acceptance action | AC-34, AC-41 | `F-04-operator-accepted.png` | Operator list after acceptance: `CB-000001` is `Accepted` and its action button is gone |
| 7 | Customer sees `ACCEPTED` | AC-41 | `F-04-customer-accepted.png` | Customer order `CB-000001` with `Accepted` badge and a two-row history: `Order placed` then `Pending → Accepted` by `OPERATOR` |

## 2. Screenshot evidence — rejection and access control

| Behaviour | AC | File | What the screenshot shows |
|---|---|---|---|
| Unavailable item rejected without losing the cart | AC-21, AC-30 | `F-03-order-unavailable-409.png` | Inline alert "Mango Sticky Rice is sold out." while both cart lines and the total stay on screen; no navigation |
| Customer blocked from an operator screen | AC-42 | `F-04-customer-forbidden-403.png` | In-place 403 Forbidden alert instead of the operator order table |
| Logout returns to the login form | AC-06, AC-09 | `F-01-after-logout-login.png` | Post-logout state; the old session cookie is rejected (401 asserted by TEST-06) |
| My orders list | AC-28, AC-31 | `F-03-my-orders.png` | Customer order table with number, placed time, status and total, newest first |

## 3. Terminal evidence — red, then green

Every feature was seen failing before it passed. The file names record the commit under test.

| Feature | Red run | Green run | End-to-end |
|---|---|---|---|
| F-01 Authentication and session | `F-01-red-full-8398fe2.txt`, `F-01-red-TEST-06-05a4f08.txt`, `F-01-red-TEST-09-retroactive-60b5e57.txt` | `F-01-green-full-f222daa.txt` (backend 30 passed, frontend 1 passed), `F-01-green-TEST-06-f222daa.txt` | `F-01-e2e-097da41.txt` (1 journey passed) |
| F-02 Menu, F-03 Order submission | `F-02-F-03-red-140c030.txt` | `F-02-F-03-green-tests-0f3c649.txt` (backend 69 passed, frontend 22 passed) | `F-02-F-03-green-e2e-0f3c649.txt` (3 journeys passed) |
| F-04 Operator acceptance | `F-04-red-c04ca45.txt` | `F-04-green-tests-37cf31f.txt` (backend 82 passed, frontend 36 passed), `F-04-TEST-40-mutation-37cf31f.txt` | `F-04-green-e2e-37cf31f.txt` (5 journeys passed) |
| R-01 Access control | `R-01-red-TEST-43-d7792c8.txt` | `R-01-green-TEST-43-8f42cbd.txt`, `R-01-green-tests-c8fd8fc.txt` (backend 84 passed, frontend 36 passed) | `R-01-green-e2e-c8fd8fc.txt` (6 journeys passed) |

Supporting logs: `F-01-build-097da41.txt`, `F-01-typecheck-097da41.txt`, `F-01-test-097da41.txt`, `F-01-logout-401-097da41.txt`, `F-02-F-03-green-build-0f3c649.txt`, `F-04-green-build-*.txt`, `F-04-green-e2e-*.txt`, `R-01-green-build-c8fd8fc.txt`.

Commands used for every run:

```bash
npm test          # backend Vitest + Supertest, then frontend Vitest
npm run e2e       # Playwright journeys on ports 3100 / 5174
npm run typecheck
npm run build
```

## 4. Derived evidence documents

| File | Contents |
|---|---|
| `test-excerpts.md` | Annotated excerpts of TEST-24 (concurrent last unit) and TEST-27 (cross-customer access), the two test excerpts required by the contract §6 |
| `github-workflow.md` | Issue → PR chains, authors, reviewers and merge points for Sprint 1 |
| `sprint-1-commit-log.txt` | Commit history of `sprint-1-staging`, showing contracts before implementation |

## 5. Event screenshots and their capture

All screenshots were produced by running the application (backend on `localhost:3000`, Vite on `localhost:5173`) against the seeded development database, signed in as the seeded customer or operator. Playwright can refresh part of the set through `frontend/e2e/evidence.ts`; the rest need a manual capture of the same flow.

## 6. Outstanding items and known gaps

These are disclosed rather than hidden; they belong to the team/Lab 5 and Sprint 2–3 work:

- **NFR-05 load benchmark (autocannon) has not been run.** It is allocated to Sprint 3 in `docs/srs.md` and `docs/traceability.md`, so the row is `NOT RUN` by design.
- **The full suite has not been re-run since `c8fd8fc`.** Later commits are documentation, the route-registry refactor, a test-database guard sync test and CI changes; a fresh green run should replace this log before submission.
- **No separate order-confirmation screen.** The application navigates straight to the order detail after a successful POST, so `F-03-order-detail.png` is the confirmation evidence.
- **The operator acceptance is captured after the action** (the order shows `Accepted`), so the Accept button itself is not visible in the screenshot; TEST-41 exercises the click end to end.
- **"Oldest first" is asserted, not visually demonstrated.** `F-01-operator-orders.png` shows a single order; ordering is proven by TEST-32.
- **Login validation screenshot covers invalid credentials**, not the 400 field-validation state; that path is covered by TEST-04.
- **Release tag `sprint-1-v1.0`** from the contract has not been created yet.
- **Contribution table and AI-use declaration** are team-authored statements and are not generated here.
- **Deliverable format is DOCX**, not PDF, as agreed for this submission; export to PDF from Word if the course requires PDF.

## 7. Integrity

- No real secrets, API keys or personal data are stored here. Seed accounts are synthetic (`@campusbites.test`), and passwords exist only in the local, untracked `backend/.env`.
- Every log names the commit it was produced from, so a result can be tied to a revision.
- Screenshots show only seeded demo data.
