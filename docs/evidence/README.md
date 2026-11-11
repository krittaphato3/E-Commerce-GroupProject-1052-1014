# Omazon — Sprint 1 Evidence Pack (Deliverable 1, Part F)

| Item | Value |
|---|---|
| Document | `docs/evidence/README.md` |
| Sprint | 1 (Deliverable 1) |
| Version | 1.1 |
| Date | 2026-11-11 |
| Related | `docs/traceability.md`, `docs/sprints/sprint-1/features.md` §6. The assembled Word file is produced from these sources and submitted outside this repository. |

### Revision history
| Version | Date | Change | Reason |
|---|---|---|---|
| 1.0 | 2026-11-07 | Initial evidence pack index: screenshots, red/green logs, derived documents | Deliverable 1, Part F |
| 1.1 | 2026-11-11 | NFR-05 baseline re-measured at `5c3f984`; the earlier baseline cited a commit hash that does not exist in the repository | Pre-submission audit (Issue #18) |

This directory holds the evidence that the Sprint 1 requirements were met by running the product, not by assertion. File names carry the feature or responsibility they support (`F-01` to `F-04`, `R-01`), and terminal logs carry the tested commit hash in their file name.

## 1. Screenshot evidence — required flows

The seven flows required by the Sprint 1 deliverable, captured from the running application:

| # | Required flow | AC | File | What the screenshot shows |
|---|---|---|---|---|
| 1 | Login page | AC-01, AC-09 | `F-01-login-page.png` | The empty login form: email, password and a single Log in action |
| 1 | Login validation | AC-02, AC-04 | `F-01-login-failure.png` | A failed login showing the generic "Invalid email or password." alert |
| 2 | Menu browsing, available and sold out | AC-10, AC-12 | `F-01-customer-menu.png` | Desktop menu with THB prices, a "1 left" stock hint, "Sold out" badges on Chicken Sandwich and Pad Thai, and the cart panel |
| 2 | Menu browsing at phone width | AC-10, AC-12 | `F-02-menu-sold-out-mobile.png` | The same catalogue at 430 px: sold-out badges, the low-stock hint and disabled Add buttons stay visible |
| 3 | Cart before confirmation | AC-14, AC-15 | `F-03-cart-filled.png` | Cart with two lines, per-line totals, estimated total `฿150.00` and an empty pickup note |
| 3 | Order confirmation | AC-14, AC-29 | `F-03-order-detail.png` | The screen shown straight after placing: order number, `Pending` and `Unpaid` badges, line items, total, pickup note |
| 4 | Customer order detail (`PENDING`) | AC-14, AC-25, AC-29 | `F-03-order-detail.png` | Same screen: server-calculated total and the first `Order placed` history row with actor `CUSTOMER` and a timestamp |
| 5 | Operator orders dashboard (oldest first) | AC-32, AC-33 | `F-01-operator-orders.png` | Operator "Incoming orders" with the Pending filter: two orders with distinct placed times, `CB-000001` above `CB-000002`, each with an Accept button |
| 6 | Operator order acceptance action | AC-34, AC-41 | `F-04-operator-accept-action.png` | Row `CB-000001` while still `PENDING`, with the green Accept button before it is clicked |
| 6 | Operator order accepted | AC-34, AC-41 | `F-04-operator-accepted.png` | The All view after the click: `CB-000001` is `ACCEPTED` with no action, `CB-000002` is still `PENDING` |
| 7 | Customer sees `ACCEPTED` | AC-41 | `F-04-customer-accepted.png` | Customer order `CB-000001` with `Accepted` and a two-row history: `Order placed`, then `Pending → Accepted` by `OPERATOR` |

## 2. Screenshot evidence — rejection and access control

| Behaviour | AC | File | What the screenshot shows |
|---|---|---|---|
| Unavailable item rejected without losing the cart | AC-21, AC-30 | `F-03-order-unavailable-409.png` | Inline alert "Mango Sticky Rice is sold out." while both cart lines and the total stay on screen; no navigation |
| Customer blocked from an operator screen | AC-42 | `F-04-customer-forbidden-403.png` | In-place "403 Forbidden: You have no access to this page." instead of the operator order table |
| My orders list | AC-28, AC-31 | `F-03-my-orders.png` | Customer order table with number, placed time, status and total, newest first |
| Logout returns to the login form | AC-06, AC-09 | `F-01-after-logout-login.png` | Post-logout state, back at the empty login form. The image is byte-identical to `F-01-login-page.png` because it is the same form and both were captured with animations disabled; TEST-06 supplies the proof that the session is gone (the old cookie is rejected with 401 and the URL is `/login`) |

## 3. Terminal evidence — red, then green

Every feature was seen failing before it passed. The file names record the commit under test.

| Feature | Red run | Green run | End-to-end |
|---|---|---|---|
| F-01 Authentication and session | `F-01-red-full-8398fe2.txt`, `F-01-red-TEST-06-05a4f08.txt`, `F-01-red-TEST-09-retroactive-60b5e57.txt` | `F-01-green-full-f222daa.txt` (backend 30 passed, frontend 1 passed), `F-01-green-TEST-06-f222daa.txt` | `F-01-e2e-097da41.txt` (1 journey passed) |
| F-02 Menu, F-03 Order submission | `F-02-F-03-red-140c030.txt` | `F-02-F-03-green-tests-0f3c649.txt` (backend 69 passed, frontend 22 passed) | `F-02-F-03-green-e2e-0f3c649.txt` (3 journeys passed) |
| F-04 Operator acceptance | `F-04-red-c04ca45.txt` | `F-04-green-tests-37cf31f.txt` (backend 82 passed, frontend 36 passed), `F-04-TEST-40-mutation-37cf31f.txt` | `F-04-green-e2e-37cf31f.txt` (5 journeys passed) |
| R-01 Access control | `R-01-red-TEST-43-d7792c8.txt` | `R-01-green-TEST-43-8f42cbd.txt`, `R-01-green-tests-4a37e95.txt` (backend 85 passed, frontend 36 passed) | `R-01-green-e2e-4a37e95.txt` (6 journeys passed) |

Supporting logs: `F-01-build-097da41.txt`, `F-01-typecheck-097da41.txt`, `F-01-test-097da41.txt`, `F-01-logout-401-097da41.txt`, `F-02-F-03-green-build-0f3c649.txt`, `F-04-green-build-*.txt`, `F-04-green-e2e-*.txt`, `R-01-green-build-4a37e95.txt`.

The R-01 row supersedes the earlier `c8fd8fc` runs (`R-01-green-tests-c8fd8fc.txt`, `R-01-green-e2e-c8fd8fc.txt`, `R-01-green-build-c8fd8fc.txt`), which are kept for history. The current logs were produced at `4a37e95`, the commit this pack documents, after the Playwright specs last changed in `9d8e7cb`.

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

## 5. How the screenshots were produced

All screenshots come from Playwright driving the real application, not from a mock:

```bash
CAPTURE_EVIDENCE=1 npm run e2e
```

- `frontend/e2e/evidence.ts` writes the files only when `CAPTURE_EVIDENCE=1`, so a normal `npm run e2e` leaves the committed set untouched.
- `playwright.config.ts` starts the API on port 3100 and Vite on port 5174; `globalSetup` resets and re-seeds the **test** database first, so every run starts from the same catalogue and order numbering.
- Screenshots are full page and captured with `animations: "disabled"`, because Bootstrap buttons transition their colour over ~150 ms; without that, the first painted frame shows the previous filter state.
- The acceptance action (E-10) is a row-level capture, so the Accept button and the `PENDING` status it acts on appear together.

## 6. Outstanding items and known gaps

These are disclosed rather than hidden; they belong to the team/Lab 5 and Sprint 2–3 work:

- **NFR-05 load benchmark (autocannon) has a recorded Sprint 1 baseline.** LOAD-01 was re-measured at `5c3f984` on 2026-11-11 (5 runs × 30 s per endpoint at 20 connections, 500-order seed): `GET /api/menu` p95 1 ms and `POST /api/orders` p95 40 ms (run-level median), zero 5xx. Raw runs, the summary and the run transcript are in [`nfr05/`](nfr05/README.md); R-04 hardening and the deployed-build measurement stay in Sprint 3. The earlier 2026-11-10 baseline cited a commit hash that does not exist in the repository, which is why it was re-run rather than re-cited.
- **The unit, integration and Playwright suites were last run at `4a37e95`**, the commit this pack documents (backend 85 passed, frontend 36 passed, 6 journeys passed). The screenshots were captured one documentation commit earlier at `9d8e7cb`; no runtime code changed between the two.
- **No separate order-confirmation screen.** The application navigates straight to the order detail after a successful POST, so `F-03-order-detail.png` is the confirmation evidence.
- **The login screenshot covers invalid credentials**, not the 400 field-validation state; that path is covered by TEST-04.
- **Release tag `sprint-1-v1.0`** from the contract has not been created yet.
- **Contribution table and AI-use declaration** are team-authored statements and are not generated here.
- **Deliverable format is DOCX**, not PDF, as required by the submission; export to PDF from Word if the receiving site requires PDF. The assembled file and the scripts that build it are not tracked in Git and are submitted outside this repository.

## 7. Integrity

- No real secrets, API keys or personal data are stored here. Seed accounts are synthetic (`@campusbites.test`), and passwords exist only in the local, untracked `backend/.env`.
- Every log names the commit it was produced from, so a result can be tied to a revision.
- Screenshots show only seeded demo data.
